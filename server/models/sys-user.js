'use strict';
const USER_TYPES = require('../enum/userTypes');
const ms = require('ms');
const jwt = require('../lib/jwt');
const Handlebars = require('handlebars');
const axios = require('axios');
const _ = require('lodash');
const { basic_resource, students_v1_db, teacher_db, users_v1_db } = require('../../database-config');
const Environment = require('../config/environment');

module.exports = (SysUser) => {
    delete SysUser.validations.email;

    const executeQuery = (sql, params = []) => {
        const { dataSources } = SysUser.app;
        const { connector } = dataSources.db;

        return new Promise((resolve, reject) => {
            connector.execute(sql, params, {}, (err, rows) => {
                if (err) return reject(err);

                resolve(rows);
            });
        });
    };

    SysUser.getUser = async function (objects, includes) {
        let options = {
            where: {
                id: {
                    inq: _.map(objects, 'userId'),
                },
            },
            include: includes,
        };

        let users = await SysUser.find(options);
        return users;
    };

    SysUser.me = function (accessToken, done) {
        const decoded = jwt.verify(accessToken);
        const userId = decoded.params ? decoded.params.userId : null;
        let tokenError = new Error('Unauthorized');
        tokenError.status = 401;
        if (!userId) return done(tokenError);

        SysUser.findById(userId, (err, user) => {
            if (err) return done(err);
            if (!user) {
                let error = new Error('Not Found');
                error.status = 404;
                return done(error);
            }
            return done(null, user);
        });
    };

    SysUser.beforeRemote('create', function (ctx, user, done) {
        if (ctx.req.body.profile) {
            let Profile = SysUser.app.models.Profile;
            let profile = new Profile(ctx.req.body.profile);
            profile.isValid(function (valid) {
                if (!valid) {
                    done({
                        statusCode: 422,
                        name: 'ValidationError',
                        details: { context: 'Profile', codes: profile.errors },
                    });
                } else {
                    done(null, {});
                }
            });
        } else {
            done(null, {});
        }
    });

    SysUser._invalidateAccessTokensOfUsers = function (userIds, options, cb) {
        if (typeof options === 'function' && cb === undefined) {
            cb = options;
            options = {};
        }

        if (!Array.isArray(userIds) || !userIds.length) return process.nextTick(cb);

        var accessTokenRelation = this.relations.accessTokens;
        if (!accessTokenRelation) return process.nextTick(cb);

        var AccessToken = accessTokenRelation.modelTo;
        var query = { userId: { inq: userIds } };
        var tokenPK = AccessToken.definition.idName() || 'id';
        if (options.accessToken && tokenPK in options.accessToken) {
            query[tokenPK] = { neq: options.accessToken[tokenPK] };
        }
        // add principalType in AccessToken.query if using polymorphic relations
        // between AccessToken and User
        var relatedUser = AccessToken.relations.user;
        var isRelationPolymorphic = relatedUser && relatedUser.polymorphic && !relatedUser.modelTo;
        if (isRelationPolymorphic) {
            query.principalType = this.modelName;
        }

        AccessToken.deleteAll(query, cb);
    };

    SysUser.resetPassword = function (options, done) {
        const TTL = ms(Environment.getValue('token_expiration_time')).toString();
        if (typeof options.email !== 'string') {
            var err = new Error('Email is required');
            err.statusCode = 400;
            err.code = 'EMAIL_REQUIRED';
            done(err);
            return Promise.reject(err);
        }

        var where = {
            email: options.email,
        };

        SysUser.findOne({ where: where }, function (err, user) {
            if (err) {
                return cb(err);
            }
            if (!user) {
                var err = new Error('Email não encontrado!');
                err.statusCode = 404;
                err.code = 'EMAIL_NOT_FOUND';
                return done(err);
            }

            user.userTypes((err, userTypes) => {
                let userType;
                if (options.userTypeId && options.userTypeId != 5) {
                    userType = _.find(userTypes, (_userType) => {
                        return _userType.id == 1 || options.userTypeId == _userType.id || (options.userTypeId == 3 && _userType.id == 4);
                    });
                } else {
                    userType = _.first(userTypes);
                }

                if (!userType) {
                    userType = { id: options.userTypeId };
                }

                if (userType) {
                    user.createAccessToken(TTL, onTokenCreated(userType));
                } else {
                    const err = new Error('Usuário não encontrado!');
                    err.statusCode = 404;
                    err.code = 'USER_NOT_FOUND';

                    return done(err);
                }
            });

            function onTokenCreated(userType) {
                return (err, accessToken) => {
                    if (err) {
                        return done(err);
                    }
                    done();

                    accessToken.userTypeId = !userType ? SysUser.app.models.UserType.PUBLIC.id : userType.id;
                    var paramsEmitPassword = { email: options.email, accessToken: accessToken, user: user, options: options };
                    SysUser.emit('resetPasswordRequest', paramsEmitPassword);
                };
            }
        });
    };

    SysUser.afterRemote('create', function (ctx, user, done) {
        if (ctx.req.body.profile) {
            ctx.req.body.profile['userId'] = user.id;
            let Profile = SysUser.app.models.Profile;
            return Profile.create(ctx.req.body.profile, done);
        } else {
            done(null, {});
        }
    });

    SysUser.observe('before save', async (ctx, next) => {
        if (!ctx.isNewInstance) {
            const profile = _.get(ctx, 'data.profile');
            if (profile) {
                profile.userId = ctx.currentInstance.id;
                ctx.hookState['data'] = { profile };
            }
        }
    });

    SysUser.observe('after save', async (ctx, next) => {
        if (_.get(ctx, 'hookState.data.profile') && ctx.hookState.data.profile.userId) {
            const profile = await SysUser.app.models.Profile.findOne({ where: { userId: ctx.hookState.data.profile.userId } });
            _.each(ctx.hookState.data.profile, (v, k) => {
                if (profile[k] && k != 'userId') {
                    profile[k] = v;
                }
            });
            await profile.save();
        }
    });

    SysUser.verifyIfStudentHasBrand = async function (userId, brandId) {
        return await SysUser.exec(
            SysUser,
            `SELECT *
    FROM
    ${users_v1_db}.users
    INNER JOIN ${users_v1_db}.school_students ON school_students.userId = users.id
    INNER JOIN ${students_v1_db}.student_registrations ON student_registrations.studentId = school_students.id
    WHERE
    users.id = ${userId}
    AND student_registrations.brandId = ${brandId}
    AND student_registrations.deletedAt is null
    LIMIT 1;`
        );
    };

    SysUser.verifyIfTeacherHasBrand = async function (userId, brandId) {
        return await SysUser.exec(
            SysUser,
            `SELECT *
    FROM
    ${users_v1_db}.users
    INNER JOIN ${users_v1_db}.school_teachers ON school_teachers.userId = users.id
    INNER JOIN ${teacher_db}.teacher_classes ON teacher_classes.schoolTeacherId = school_teachers.id
    WHERE
    users.id = ${userId}
    AND teacher_classes.brandId = ${brandId}
    AND teacher_classes.deletedAt IS NULL
    LIMIT 1;`
        );
    };

    SysUser.observe('loaded', async (ctx) => {
        if (ctx.isNewInstance) {
            return;
        }

        if (ctx.options.accessToken && ctx.options.accessToken.token) {
            const token = ctx.options.accessToken.token;
            const tokenPublic = jwt.verify(token);

            const brandId = tokenPublic.params && tokenPublic.params.brandId;
            const userId = tokenPublic.params && tokenPublic.params.userId;
            if (!userId) return;
            const userTypes = await SysUser.exec(
                SysUser,
                `SELECT ut.id, ut.name FROM ${users_v1_db}.users AS u INNER JOIN ${users_v1_db}.user_types_users AS utu ON utu.sysUserId = u.id inner join ${users_v1_db}.user_types as ut on ut.id = utu.userTypeId WHERE u.id = ${userId}`
            );
            const userTypesARRAY = userTypes.map((el) => el.name);

            if (brandId) {
                if (userTypesARRAY.includes('STUDENT')) {
                    delete ctx.data.__cachedRelations;
                    const studentQuery = await SysUser.verifyIfStudentHasBrand(ctx.data.id, brandId);
                    if (studentQuery.length <= 0) {
                        delete ctx.data.schoolStudents;
                    }
                }
                if (userTypesARRAY.includes('RESPONSIBLE')) {
                    delete ctx.data.__cachedRelations;
                    const responsibleQuery = await SysUser.exec(
                        SysUser,
                        `SELECT * FROM ${users_v1_db}.users
              INNER JOIN ${users_v1_db}.school_student_responsibles ON school_student_responsibles.userId = users.id
              INNER JOIN ${users_v1_db}.school_students ON school_students.id = school_student_responsibles.schoolStudentId
              INNER JOIN ${students_v1_db}.student_registrations ON student_registrations.studentId = school_students.id
              WHERE
                users.id = ${ctx.data.id}
                AND student_registrations.brandId = ${brandId}
                AND student_registrations.deletedAt IS NULL
                LIMIT 1;`
                    );
                    if (responsibleQuery.length <= 0) {
                        delete ctx.data.schoolStudentResponsibles;
                    }
                }
                if (userTypesARRAY.includes('TEACHER')) {
                    delete ctx.data.__cachedRelations;
                    const teacherQuery = await SysUser.verifyIfTeacherHasBrand(ctx.data.id, brandId);
                    if (teacherQuery.length <= 0) {
                        delete ctx.data.schoolTeachers;
                    }
                }
            }

            if (ctx.data.schoolStudents && ctx.data.schoolStudents.length > 0) {
                const schoolStudents = [];
                await Promise.all([
                    ctx.data.schoolStudents.reduce(async (acc, object) => {
                        const userId = object.__data.userId;
                        const [hasBrand] = await SysUser.verifyIfStudentHasBrand(userId, brandId);
                        if (hasBrand) {
                            schoolStudents.push(object);
                        }
                        return acc;
                    }, []),
                ]);
                ctx.data.schoolStudents = schoolStudents;
            }

            if (ctx.data.schoolStudentResponsibles && ctx.data.schoolStudentResponsibles.length > 0) {
                const schoolStudentResponsibles = [];
                await Promise.all([
                    ctx.data.schoolStudentResponsibles.reduce(async (acc, object) => {
                        const userId = object.__data.schoolStudent.userId;
                        const [hasBrand] = await SysUser.verifyIfStudentHasBrand(userId, brandId);
                        if (hasBrand) {
                            schoolStudentResponsibles.push(object);
                        }
                        return acc;
                    }, []),
                ]);
                ctx.data.schoolStudentResponsibles = schoolStudentResponsibles;
            }

            if (ctx.data.schoolTeachers && ctx.data.schoolTeachers.length > 0) {
                const schoolTeachers = [];
                await Promise.all([
                    ctx.data.schoolTeachers.reduce(async (acc, object) => {
                        const userId = object.__data.userId;
                        const [hasBrand] = await await SysUser.verifyIfTeacherHasBrand(userId, brandId);
                        if (hasBrand) {
                            schoolTeachers.push(object);
                        }
                        return acc;
                    }, []),
                ]).catch((error) => console.log(error));
                ctx.data.schoolTeachers = schoolTeachers;
            }
        }
    });

    SysUser.on('resetPasswordRequest', function (info) {
        SysUser.JWTByAccessToken(info.accessToken, (err, token) => {
            if (err) return console.error(err);
            SysUser.sendResetPassword(token, (err) => {
                if (err) return console.error(err);
                console.log('resetPassword email sended');
            });
        });
    });

    SysUser.sendResetPassword = function (info, done) {
        Promise.all([
            axios(Environment.getValue('email_s3') + '/master_v1.html').then((response) => response.data),
            axios(Environment.getValue('email_s3') + '/reset_password.html').then((response) => response.data),
        ])
            .then((collection) => {
                var emailContent = collection[1];
                var masterTemplate = collection[0].replace("{{> (lookup . 'templateName') }}", emailContent);

                let base_path = Environment.getValue('ui_staff_path');
                if (
                    info.userTypeId == SysUser.app.models.UserType.STUDENT.id ||
                    info.userTypeId == SysUser.app.models.UserType.RESPONSIBLE.id
                ) {
                    base_path = Environment.getValue('ui_student_path');
                } else if (info.userTypeId == SysUser.app.models.UserType.TEACHER.id) {
                    base_path = Environment.getValue('ui_teacher_path');
                }

                var template = Handlebars.compile(masterTemplate);
                var options = {
                    user_email: info.user.email,
                    base_path,
                    token: info.accessToken,
                };

                console.log(info.accessToken);
                var htmlTemplate = template(options);

                var emailsParams = {
                    to: info.user.email,
                    from: Environment.getValue('email_from'),
                    subject: 'AZ - Alteração de senha',
                    html: htmlTemplate,
                };
                SysUser.app.models.Email.send(emailsParams)
                    .then((result) => {
                        done(null, result);
                    })
                    .catch(done);
            })
            .catch(done);
    };

    SysUser.JWTByAccessToken = function (acccessToken, done) {
        const TTL = ms(Environment.getValue('token_expiration_time')).toString();
        SysUser.findById(acccessToken.userId)
            .then((user) => {
                return user.userTypes(
                    {
                        where: { id: acccessToken.userTypeId || SysUser.app.models.UserType.SUPERUSER.id },
                    },
                    (err, userTypes) => {
                        if (err) return done(err);
                        if (userTypes.length) {
                            acccessToken.userTypeId = userTypes[0].id;
                        } else {
                            acccessToken.userTypeId = SysUser.app.models.UserType.PUBLIC.id;
                        }
                        var bodyJSON = acccessToken.toPlanObject.bind(acccessToken);
                        var JWT_TOKEN = jwt.generate(bodyJSON(), TTL);
                        acccessToken.token = JWT_TOKEN;
                        acccessToken.save((err) => {
                            if (err) return done(err);
                            return done(null, {
                                accessToken: acccessToken.token,
                                ttl: TTL,
                                userTypeId: acccessToken.userTypeId,
                                user: user,
                            });
                        });
                    }
                );
            })
            .catch(done);
    };

    SysUser.exec = async function (model, sql, params = [], tx) {
        return new Promise((resolve, reject) => {
            let transaction = {};
            if (tx) {
                transaction = { transaction: tx };
            }
            model.app.dataSources.db.connector.execute(sql, params, transaction, function (err, data) {
                if (err) {
                    return reject(err);
                }
                resolve(data);
            });
        });
    };

    let loginUser = SysUser.login;
    SysUser.login = function (crendentials, modelName, done) {
        const { username, password, clientId } = crendentials;
        loginUser.call(this, { username, password }, 'user', async (err, token) => {
            if (err) {
                return done(err);
            }
            const [brand] = await SysUser.exec(SysUser, `SELECT * FROM ${basic_resource}.brands WHERE clientId = '${clientId}';`);
            if (!brand) {
                const error = new Error('brand not found');
                error.status = 400;
                return done(error);
            }
            token.__data.brandId = brand.id;
            SysUser.JWTByAccessToken(token, done);
        });
    };

    SysUser.generateSSOToken = function (userId, brandId, lexUserId, req, done) {
        const TTL = ms(Environment.getValue('token_expiration_time')).toString();
        const X_API_KEY = Environment.getValue('x_api_key');
        const xApiKey = req.headers['x-api-key'];

        if (!xApiKey || xApiKey !== X_API_KEY) {
            return done('x-api-key invalid');
        }

        SysUser.findById(userId)
            .then((user) => {
                if (!user) {
                    const error = new Error('user not found');
                    error.status = 400;
                    return done(error);
                }

                user.createAccessToken(TTL, { username: user.username, brandId, lexUserId, ttl: TTL }, (err, acccessToken) => {
                    if (err) {
                        return done(err);
                    }
                    if (acccessToken) {
                        acccessToken.__data.brandId = brandId;
                        acccessToken.__data.lexUserId = lexUserId;
                    }
                    SysUser.JWTByAccessToken(acccessToken, done);
                });
            })
            .catch(done);
    };

    const convertWhereFilterToSQL = (filter) => {
        const { where: whereFilter } = filter;
        let sqlWhere = '';

        if (whereFilter['profile.fullName'])
            sqlWhere += `AND CONCAT(p.firstName, " ", p.lastName) LIKE "${whereFilter['profile.fullName']?.like}" `;

        if (whereFilter['email']) sqlWhere += `AND u.email LIKE "${whereFilter['email']?.like}" `;

        if (whereFilter['username']) sqlWhere += `AND u.username LIKE "${whereFilter['username']?.like}" `;

        return sqlWhere;
    };

    const convertOrderByFilterToSQL = (filter) => {
        const data = filter.order?.split(' ');
        const [column, order] = data;

        const orderBy = {
            'id': 'u.id',
            'username': 'u.username',
            'email': 'u.email',
            'cpf': 'u.cpf',
        };

        return `${orderBy[column]} ${order}`;
    };

    const formatProfileResult = (row) => {
        return {
            firstName: row.firstName,
            lastName: row.lastName,
            userId: row.profileUserId,
            id: row.profileId,
            fullName: row.fullName,
        };
    };

    const formatCustomUsersResult = (data) => {
        return data.map((row) => {
            return {
                email: row.email,
                cpf: row.cpf,
                username: row.username,
                externalId: row.externalId,
                id: row.id,
                deletedAt: row.deletedAt,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
                profile: formatProfileResult(row),
            };
        });
    };

    const getCustomUsers = async (filter) => {
        const { limit, skip } = filter;
        const where = convertWhereFilterToSQL(filter);
        const orderBy = convertOrderByFilterToSQL(filter);

        const sql = `
            SELECT DISTINCT
                u.*,
                p.firstName,
                p.lastName,
                p.userId AS profileUserId,
                p.id AS profileId,
                TRIM(CONCAT(p.firstName, " ", p.lastName)) AS fullName
            FROM
                ${users_v1_db}.users u
                INNER JOIN ${users_v1_db}.profiles p ON u.id = p.userId
            WHERE
                u.deletedAt IS NULL
                ${where}
            ORDER BY
                ${orderBy}
            LIMIT
                ${limit}
            OFFSET
                ${skip}
        `;

        const result = await executeQuery(sql);

        return formatCustomUsersResult(result);
    };

    const countCustomUsers = async (filter) => {
        const where = convertWhereFilterToSQL(filter);
        const sql = `
            SELECT
                COUNT(DISTINCT u.id) AS total
            FROM
                ${users_v1_db}.users u
                INNER JOIN ${users_v1_db}.profiles p ON u.id = p.userId
            WHERE
                u.deletedAt IS NULL
                ${where}
        `;

        const [data] = await executeQuery(sql);

        return data?.total || 0;
    };

    SysUser.customSearch = async (filter, res) => {
        const [result, count] = await Promise.all([getCustomUsers(filter), countCustomUsers(filter)]);

        res.set('x-total-count', count);

        return result;
    };
};
