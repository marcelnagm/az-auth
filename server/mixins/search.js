const _ = require('lodash');
const app = require('../server');

module.exports = (Model, options) => {
    const properties = Object.keys(Model.definition.properties);
    // console.log(properties)
    let defaultOptions = {};
    let models = options.models;
    const buildJoins = () => {
        let joins = '';
        _.each(models, (model, i) => {
            if (model.required == undefined || !!model.required) {
                joins += ` INNER JOIN ${model.tableName} on ${model.tableName}.${model.keys[0]}=${model.relation}.${model.keys[1]}`;
            } else {
                joins += ` LEFT JOIN ${model.tableName} on ${model.tableName}.${model.keys[0]}=${model.relation}.${model.keys[1]}`;
            }
        });

        return joins;
    };

    const validateProprities = (property) => {
        return _.includes(properties, property);
    };
    const buildWhere = (_where) => {
        if (!_where) {
            return { where: '', whereValues: [] };
        }
        let keys = Object.keys(_where);

        let where = '';
        let defaultTable = options.tableName.split('.')[1];
        let whereValues = [];
        _.each(keys, (key) => {
            let model = key.split('.');
            let parameterKey = model[0];
            let parameterValue = model[1];
            let modelFound = models[parameterKey];

            if (_.isPlainObject(_where[key])) {
                _.each(_where[key], (value, k) => {
                    let customField = _.get(modelFound, 'customField');
                    if (modelFound && customField && customField[parameterValue]) {
                        let ModelLoopback = Model.app.models[modelFound.model];

                        let methodName = `ModelLoopback.${customField[parameterValue]}(${JSON.stringify(_where[key])})`;
                        let sqlAndValues = eval(methodName);
                        where += sqlAndValues.sql;
                        _.each(sqlAndValues.values, (item) => {
                            whereValues.push(item);
                        });
                    } else {
                        if (modelFound) {
                            where += ` AND ${modelFound.tableName}.${parameterValue} ${k} ?`;
                        } else {
                            where += ` AND ${options.tableName}.${key} ${k} ?`;
                        }
                        whereValues.push(value);
                    }
                });
            } else if (modelFound) {
                where += ` AND ${modelFound.tableName}.${parameterValue}=?`;
                whereValues.push(_where[key]);
            } else if (validateProprities(key)) {
                where += ` AND ${options.tableName}.${key} = ?`;
                whereValues.push(_where[key]);
            } else if (key === 'brandId') {
                where += ` AND teacher_classes.brandId = ? AND teacher_classes.deletedAt is NULL `;
                whereValues.push(_where[key]);
            }
        });

        return { where, whereValues };
    };

    const buildQuery = (filter = {}) => {
        let { limit, skip, where, order } = filter;
        let paginate = ` LIMIT ${skip || 0},${limit || 15};`;
        let joins = buildJoins();
        let whereObject = buildWhere(where);
        let orderBy = ' ORDER BY ';
        let sql = `SELECT DISTINCT ${options.tableName}.*`;
        let sqlCount = `SELECT COUNT(DISTINCT ${options.tableName}.id) as count`;
        if (order && order.indexOf('.') > 0) {
            let model = order.split('.');
            let parameterKey = model[0];
            let parameterValue = model[1];
            let modelFound = models[parameterKey];

            sql += `, ${(modelFound || options).tableName}.${_.first(parameterValue.split(' '))} `;
            orderBy += `${(modelFound || options).tableName}.${parameterValue}`;
        } else if (order) {
            orderBy += `${options.tableName}.${order}`;
        } else {
            orderBy += `${options.tableName}.id ASC`;
        }

        sql += ` from ${options.tableName}`;
        sqlCount += ` from ${options.tableName}`;
        where = ` WHERE ${options.defaultWhere}`;

        if (where) {
            where += ` ${whereObject.where}`;
        }
        sql += joins;
        sqlCount += joins;
        sql += where;
        sqlCount += where;
        sql += orderBy;
        sqlCount += orderBy;
        sql += paginate;

        return { sqlCount, sql, values: whereObject.whereValues };
    };

    const buildRelation = async (results) => {
        let _models = _.pickBy(models, (value, key) => {
            return value.fn;
        });
        // Model.app.models
        let promises = [];
        _.each(_models, (source, key) => {
            let ModelLoopback = Model.app.models[source.model];
            let includes = '{}';
            if (source.includes) {
                includes = JSON.stringify(source.includes);
            }
            let methodName = `ModelLoopback.${source.fn}(${JSON.stringify(results)}, ${includes})`;
            let method = eval(methodName);
            method
                .then((objects) => {
                    _.each(results, (item) => {
                        let obj = {};
                        obj[source.keys[0]] = item[source.keys[1]];
                        let itemsRelations;
                        if (source.isArray) {
                            itemsRelations = _.filter(objects, obj);
                        } else {
                            itemsRelations = _.find(objects, obj);
                        }
                        item[key] = itemsRelations;
                    });
                })
                .catch(console.log);
            promises.push(method);
        });
        return Promise.all(promises).then(() => {
            return results;
        });

        // console.log(Object.keys(Model.app.models))
    };

    Model._search = (filter, cb) => {
        let query = buildQuery(filter);

        app.dataSources.db.connector.query(query.sqlCount, query.values, (err, count) => {
            count = _.map(count, (a) => {
                return Object.assign({}, a);
            });
            let xTotalCount = _.get(_.first(count), 'count');

            app.dataSources.db.connector.query(query.sql, query.values, (err, results) => {
                if (err) return cb(err);
                results = _.map(results, (a) => {
                    return Object.assign({}, a);
                });

                buildRelation(results)
                    .then((_results) => {
                        if (options.exclude) {
                            _.each(_results, (item) => {
                                delete item[options.exclude];
                            });
                        }
                        cb(null, _results, xTotalCount);
                    })
                    .catch(cb);
            });
        });
    };

    Model.remoteMethod('_search', {
        http: { path: '/search', verb: 'get' },
        accepts: { arg: 'filter', type: 'object' },
        returns: [
            { type: 'object', root: true },
            { arg: 'X-Total-Count', type: 'string', http: { target: 'header' } },
        ],
    });
};
