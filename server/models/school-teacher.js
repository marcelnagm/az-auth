const { basic_resource, users_v1_db, teacher_db } = require('../../database-config');
const ms = require('ms');
const jwt = require('../lib/jwt');
const Environment = require('../config/environment');
const { runExecuteSql } = require('../helpers/consultSql');

module.exports = (Teacher) => {
    Teacher.getType = () => Teacher.app.models.UserType.TEACHER;
    Teacher.getTypeSuper = () => Teacher.app.models.UserType.SUPERUSER;

    const executeQuery = (sql, params = []) => {
        const { dataSources } = Teacher.app;
        const { connector } = dataSources.db;

        return new Promise((resolve, reject) => {
            connector.execute(sql, params, {}, (err, rows) => {
                if (err) return reject(err);

                resolve(rows);
            });
        });
    };

    Teacher.observe('before save', async (ctx) => {
        if (ctx.isNewInstance) {
            const teacher = await Teacher.findOne({
                where: {
                    userId: ctx.instance.userId,
                    schoolId: ctx.instance.schoolId,
                },
            });
            if (teacher) {
                let err = new Error('Professor já cadastrado na escola.');
                err.status = 422;
                throw err;
            }
        }
    });
    Teacher.afterRemote('create', (ctx, output, next) => {
        const instance = ctx.req.body;
        const SysUser = Teacher.app.models.SysUser;
        const UserType = Teacher.app.models.UserType;

        SysUser.findById(instance.userId, (err, user) => {
            if (err) return next(err);
            if (!user) {
                const error = new Error(`User with id ${instance.userId} not found`);
                error.status = 422;
                return next(error);
            }

            UserType.findById(6, (err, userType) => {
                if (err) return next(err);
                user.userTypes.add(userType, next);
            });
        });
    });

    Teacher.loginByToken = function (schoolId, userId, clientId, request, done) {
        const TTL = ms(Environment.getValue('token_expiration_time')).toString();
        let schoolAccessToken = request.accessToken;

        if (!schoolAccessToken) {
            return done({
                statusCode: 422,
                name: 'Error',
                message: 'Access Token in request is null or undefined',
                code: 'NO_ACCESS_TOKEN',
            });
        }

        let usuarioId = request.accessToken.userId;
        let isTeacher = true;
        let isAdminOrStaff = false;

        const { userTypeId } = request.accessToken;
        const isAdmin = userTypeId === Teacher.app.models.UserType.SUPERUSER.id;
        const isStaff = userTypeId === Teacher.app.models.UserType.STAFF.id;

        if (isAdmin || isStaff) {
            isTeacher = false;
            isAdminOrStaff = true;
            usuarioId = userId;
        }

        if (clientId) {
        }

        const params = { schoolId, userId: usuarioId };
        Teacher.findOne(
            {
                fields: ['id', 'schoolId', 'userId'],
                where: params,
            },
            (error, schoolTeacher) => {
                if (error) return done(error);
                if (!schoolTeacher) return done({ statusCode: 401, name: 'Error', message: 'login failed', code: 'LOGIN_FAILED' });
                schoolAccessToken.userId = params.userId;
                schoolAccessToken.schoolRoleId = null;
                schoolAccessToken.responsibleId = null;
                schoolAccessToken.schoolTeacherId = schoolTeacher.id;
                schoolAccessToken.schoolId = schoolTeacher.schoolId;
                schoolAccessToken.userTypeId = Teacher.getType().id;
                schoolAccessToken.created = new Date();

                const tokenPublic = jwt.verify(request.accessToken.token);
                const { lexUserId, brandId } = tokenPublic?.params;

                if (clientId) {
                    let clientBrandId = 0;

                    const sqlBrand = `SELECT * FROM ${basic_resource}.brands WHERE clientId = '${clientId}'`;

                    runExecuteSql(Teacher.dataSource, sqlBrand, true).then((brand) => {
                        if (!brand) return done({ code: 404, message: 'Brand not found' });

                        clientBrandId = brand.id;
                    });

                    const obj = {
                        schoolId: schoolAccessToken.schoolId,
                        userTypeId: schoolAccessToken.userTypeId,
                        schoolTeacherId: schoolAccessToken.schoolTeacherId,
                        schoolRoleId: schoolAccessToken.schoolRoleId,
                        responsibleId: schoolAccessToken.responsibleId,
                        applicationId: schoolAccessToken.applicationId,
                        ttl: TTL,
                        scopes: schoolAccessToken.scopes,
                        userId: schoolAccessToken.userId,
                        created: schoolAccessToken.created,
                        deletedAt: schoolAccessToken.deletedAt,
                        lexUserId,
                    };

                    Teacher.app.models.SchoolAccessToken.create(obj, (err, newSchoolAccessToken) => {
                        if (err) {
                            console.error(err);
                        }

                        const bodyJSON = newSchoolAccessToken.toPlanObject.bind(newSchoolAccessToken)();
                        const JWT_TOKEN = jwt.generate(
                            { ...bodyJSON, isTeacher, isAdminOrStaff, brandId: clientBrandId || brandId, lexUserId },
                            TTL
                        );

                        done(null, {
                            accessToken: JWT_TOKEN,
                            schoolTeacherId: schoolAccessToken.schoolTeacherId,
                            schoolId: schoolTeacher.schoolId,
                            userId: schoolTeacher.userId,
                            ttl: TTL,
                        });
                    });
                } else {
                    const obj = {
                        schoolId: schoolAccessToken.schoolId,
                        userTypeId: schoolAccessToken.userTypeId,
                        schoolTeacherId: schoolAccessToken.schoolTeacherId,
                        schoolRoleId: schoolAccessToken.schoolRoleId,
                        responsibleId: schoolAccessToken.responsibleId,
                        applicationId: schoolAccessToken.applicationId,
                        ttl: TTL,
                        scopes: schoolAccessToken.scopes,
                        userId: schoolAccessToken.userId,
                        created: schoolAccessToken.created,
                        deletedAt: schoolAccessToken.deletedAt,
                        lexUserId,
                    };

                    Teacher.app.models.SchoolAccessToken.create(obj, (err, newSchoolAccessToken) => {
                        if (err) {
                            console.error(err);
                        }

                        const bodyJSON = newSchoolAccessToken.toPlanObject.bind(newSchoolAccessToken)();
                        const JWT_TOKEN = jwt.generate({ ...bodyJSON, isTeacher, isAdminOrStaff, brandId, lexUserId }, TTL);

                        done(null, {
                            accessToken: JWT_TOKEN,
                            schoolTeacherId: schoolAccessToken.schoolTeacherId,
                            schoolId: schoolTeacher.schoolId,
                            userId: schoolTeacher.userId,
                            ttl: TTL,
                        });
                    });
                }
            }
        );
    };

    const convertWhereFilterToSQL = (filter) => {
        const { where: whereFilter } = filter;
        let sqlWhere = '';

        if (whereFilter['profile.fullName'])
            sqlWhere += `AND CONCAT(p.firstName, " ", p.lastName) LIKE "${whereFilter['profile.fullName']?.like}" `;

        if (whereFilter['brandId']) sqlWhere += `AND tc.brandId = ${whereFilter['brandId']} `;

        if (whereFilter['schoolId']) sqlWhere += `AND s.id = ${whereFilter['schoolId']} `;

        if (whereFilter['user.username']) sqlWhere += `AND u.username LIKE "${whereFilter['user.username']?.like}" `;

        return sqlWhere;
    };

    const convertOrderByFilterToSQL = (filter) => {
        const data = filter.order?.split(' ');
        const [column, order] = data;

        const orderBy = {
            'id': 'st.id',
            'schoolId': 's.id',
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

    const formatUserResult = (row) => {
        return {
            username: row.username,
            id: row.userId,
            profile: formatProfileResult(row),
        };
    };

    const formatCustomSchoolTeachersResult = (data) => {
        return data.map((row) => {
            return {
                schoolId: row.schoolId,
                userId: row.userId,
                id: row.id,
                deletedAt: row.deletedAt,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
                user: formatUserResult(row),
                school: {
                    name: row.schoolName,
                    id: row.schoolId,
                },
            };
        });
    };

    const getCustomSchoolTeachers = async (filter) => {
        const { limit, skip } = filter;
        const where = convertWhereFilterToSQL(filter);
        const orderBy = convertOrderByFilterToSQL(filter);

        const sql = `
            SELECT DISTINCT
                st.*,
                s.id AS schoolId,
                s.name AS schoolName,
                u.id AS userId,
                u.username,
                p.firstName,
                p.lastName,
                p.userId AS profileUserId,
                p.id AS profileId,
                TRIM(CONCAT(p.firstName, " ", p.lastName)) AS fullName
            FROM
                ${users_v1_db}.school_teachers st
                INNER JOIN ${users_v1_db}.users u ON st.userId = u.id
                INNER JOIN ${users_v1_db}.profiles p ON u.id = p.userId
                INNER JOIN ${users_v1_db}.schools s ON st.schoolId = s.id
                LEFT JOIN ${teacher_db}.teacher_classes tc ON tc.schoolTeacherId = st.id
                AND tc.deletedAt IS NULL
            WHERE
                st.deletedAt IS NULL
                AND u.deletedAt IS NULL
                AND s.deletedAt IS NULL
                ${where}
            ORDER BY
                ${orderBy}
            LIMIT
                ${limit}
            OFFSET
                ${skip}
        `;

        const result = await executeQuery(sql);

        return formatCustomSchoolTeachersResult(result);
    };

    const countCustomSchoolTeachers = async (filter) => {
        const where = convertWhereFilterToSQL(filter);
        const sql = `
            SELECT
                COUNT(DISTINCT st.id) AS total
            FROM
                ${users_v1_db}.school_teachers st
                INNER JOIN ${users_v1_db}.users u ON st.userId = u.id
                INNER JOIN ${users_v1_db}.profiles p ON u.id = p.userId
                INNER JOIN ${users_v1_db}.schools s ON st.schoolId = s.id
                LEFT JOIN ${teacher_db}.teacher_classes tc ON tc.schoolTeacherId = st.id
                AND tc.deletedAt IS NULL
            WHERE
                st.deletedAt IS NULL
                AND u.deletedAt IS NULL
                AND s.deletedAt IS NULL
                ${where}
        `;

        const [data] = await executeQuery(sql);

        return data.total || 0;
    };

    Teacher.customSearch = async (filter, res) => {
        const [result, count] = await Promise.all([getCustomSchoolTeachers(filter), countCustomSchoolTeachers(filter)]);

        res.set('x-total-count', count);

        return result;
    };
};
