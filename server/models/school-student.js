'use strict';
const jwt = require('../lib/jwt');
const ms = require('ms');
const Environment = require('../config/environment');
const { basic_resource, schools_v1_db, students_v1_db, users_v1_db } = require('../../database-config');

module.exports = function (SchoolStudent) {
    SchoolStudent.getType = () => SchoolStudent.app.models.UserType.STUDENT;
    SchoolStudent.getTypeSuper = () => SchoolStudent.app.models.UserType.SUPERUSER;

    const executeQuery = (sql, params = []) => {
        const { dataSources } = SchoolStudent.app;
        const { connector } = dataSources.db;

        return new Promise((resolve, reject) => {
            connector.execute(sql, params, {}, (err, rows) => {
                if (err) return reject(err);

                resolve(rows);
            });
        });
    };

    SchoolStudent.getSchoolStudent = async function (objects, includes) {
        let options = {
            where: {
                id: {
                    inq: objects.map((i) => i.schoolStudentId),
                },
            },
            include: includes,
        };

        let schoolStudent = await SchoolStudent.find(options);
        return schoolStudent;
    };

    SchoolStudent.afterRemote('create', (ctx, output, next) => {
        const instance = ctx.req.body;
        const SysUser = SchoolStudent.app.models.SysUser;
        const UserType = SchoolStudent.app.models.UserType;

        SysUser.findById(instance.userId, (err, user) => {
            if (err) return next(err);
            if (!user) {
                const error = new Error(`User with id ${instance.userId} not found`);
                error.status = 422;
                return next(error);
            }

            UserType.findById(3, (err, userType) => {
                if (err) return next(err);
                user.userTypes.add(userType, next);
            });
        });
    });

    SchoolStudent.exec = async function (model, sql, params = [], tx) {
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

    SchoolStudent.loginByToken = function (schoolId, userId, clientId, request, done) {
        const TTL = ms(Environment.getValue('token_expiration_time')).toString();
        let schoolAccessToken = request.accessToken;
        if (!schoolAccessToken)
            return done({
                statusCode: 422,
                name: 'Error',
                message: 'Access Token in request is null or undefined',
                code: 'NO_ACCESS_TOKEN',
            });

        let usuarioId = request.accessToken.userId;
        let isStudent = true;
        let isAdminOrStaff = false;
        if (request.accessToken.userTypeId == 1 || request.accessToken.userTypeId == 2) {
            isStudent = false;
            isAdminOrStaff = true;
            usuarioId = userId;
        }

        let params = { schoolId: schoolId, userId: usuarioId };
        SchoolStudent.findOne(
            {
                fields: ['id', 'schoolId', 'userId'],
                where: params,
            },
            (error, schoolStudent) => {
                if (error) return done(error);
                if (!schoolStudent) return done({ statusCode: 401, name: 'Error', message: 'login failed', code: 'LOGIN_FAILED' });
                schoolAccessToken.userId = params.userId;
                schoolAccessToken.schoolRoleId = null;
                schoolAccessToken.responsibleId = null;
                schoolAccessToken.schoolStudentId = schoolStudent.id;
                schoolAccessToken.schoolId = schoolStudent.schoolId;
                schoolAccessToken.userTypeId = SchoolStudent.getType().id;
                schoolAccessToken.created = new Date();

                const tokenPublic = jwt.verify(request.accessToken.token);

                if (clientId) {
                    SchoolStudent.exec(SchoolStudent, `SELECT * FROM ${basic_resource}.brands WHERE clientId = '${clientId}';`).then(
                        ([brand]) => {
                            if (!brand) {
                                return done({ code: 404, message: 'Brand not found' });
                            }
                            const { lexUserId } = tokenPublic?.params;
                            const brandId = brand.id;
                            const bodyJSON = schoolAccessToken.toPlanObject.bind(schoolAccessToken)();
                            const JWT_TOKEN = jwt.generate({ ...bodyJSON, isStudent, isAdminOrStaff, brandId, lexUserId }, TTL);
                            schoolAccessToken.token = JWT_TOKEN;

                            const obj = {
                                schoolId: schoolAccessToken.schoolId,
                                userTypeId: schoolAccessToken.userTypeId,
                                schoolStudentId: schoolAccessToken.schoolStudentId,
                                schoolRoleId: schoolAccessToken.schoolRoleId,
                                responsibleId: schoolAccessToken.responsibleId,
                                applicationId: schoolAccessToken.applicationId,
                                token: schoolAccessToken.token,
                                ttl: TTL,
                                scopes: schoolAccessToken.scopes,
                                userId: schoolAccessToken.userId,
                                schoolStudentResponsibleId: schoolAccessToken.schoolStudentResponsibleId,
                                created: schoolAccessToken.created,
                                deletedAt: schoolAccessToken.deletedAt,
                                lexUserId,
                            };

                            SchoolStudent.app.models.SchoolAccessToken.create(obj, (err) => {
                                if (err) {
                                    console.error(err);
                                }
                                done(null, {
                                    accessToken: schoolAccessToken.token,
                                    schoolStudentId: schoolAccessToken.schoolStudentId,
                                    schoolId: schoolStudent.schoolId,
                                    userId: schoolStudent.userId,
                                    ttl: TTL,
                                });
                            });
                        }
                    );
                } else {
                    const { lexUserId, brandId } = tokenPublic?.params;

                    const bodyJSON = schoolAccessToken.toPlanObject.bind(schoolAccessToken)();
                    const JWT_TOKEN = jwt.generate({ ...bodyJSON, isStudent, isAdminOrStaff, brandId, lexUserId }, TTL);
                    schoolAccessToken.token = JWT_TOKEN;

                    const obj = {
                        schoolId: schoolAccessToken.schoolId,
                        userTypeId: schoolAccessToken.userTypeId,
                        schoolStudentId: schoolAccessToken.schoolStudentId,
                        schoolRoleId: schoolAccessToken.schoolRoleId,
                        responsibleId: schoolAccessToken.responsibleId,
                        applicationId: schoolAccessToken.applicationId,
                        token: schoolAccessToken.token,
                        ttl: TTL,
                        scopes: schoolAccessToken.scopes,
                        userId: schoolAccessToken.userId,
                        schoolStudentResponsibleId: schoolAccessToken.schoolStudentResponsibleId,
                        created: schoolAccessToken.created,
                        deletedAt: schoolAccessToken.deletedAt,
                        lexUserId,
                    };

                    SchoolStudent.app.models.SchoolAccessToken.create(obj, (err) => {
                        if (err) {
                            console.error(err);
                        }
                        done(null, {
                            accessToken: schoolAccessToken.token,
                            schoolStudentId: schoolAccessToken.schoolStudentId,
                            schoolId: schoolStudent.schoolId,
                            userId: schoolStudent.userId,
                            ttl: TTL,
                        });
                    });
                }
            }
        );
    };

    const convertWhereFilterToSQL = (filter, withRegistration = false) => {
        const { where: whereFilter } = filter;
        let sqlWhere = '';

        if (whereFilter['id']) sqlWhere += `AND ss.id = ${whereFilter['id']} `;

        if (whereFilter['profile.fullName'])
            sqlWhere += `AND CONCAT(p.firstName, " ", p.lastName) LIKE "${whereFilter['profile.fullName']?.like}" `;

        if (whereFilter['user.username']) sqlWhere += `AND u.username LIKE "${whereFilter['user.username']?.like}" `;

        if (whereFilter['schoolId']) sqlWhere += `AND ss.schoolId = ${whereFilter['schoolId']} `;

        if (withRegistration) {
            if (whereFilter['schoolYearId']) sqlWhere += `AND sr.schoolYearId = ${whereFilter['schoolYearId']} `;

            if (whereFilter['schoolGradeId']) sqlWhere += `AND sr.schoolGradeId = ${whereFilter['schoolGradeId']} `;

            if (whereFilter['brandId']) sqlWhere += `AND sr.brandId = ${whereFilter['brandId']} `;

            if (whereFilter['schoolUnitId']) sqlWhere += `AND sr.schoolUnitId = ${whereFilter['schoolUnitId']} `;

            if (whereFilter['classRoomId']) sqlWhere += `AND sr.classRoomId = ${whereFilter['classRoomId']} `;
        }

        return sqlWhere;
    };

    const convertOrderByFilterToSQL = (filter) => {
        const data = filter.order?.replace('+', ' ')?.split(' ');
        const [column, order] = data;

        const orderBy = {
            'id': 'ss.id',
            'fullName': 'fullName',
        };

        return `${orderBy[column]} ${order}`;
    };

    const formatProfileResult = (row) => {
        return {
            firstName: row.firstName,
            lastName: row.lastName,
            userId: row.userId,
            id: row.profileId,
            fullName: row.fullName,
        };
    };

    const formatUserResult = (row) => {
        return {
            email: row.email,
            username: row.username,
            id: row.userId,
            profile: formatProfileResult(row),
        };
    };

    const formatCustomSchoolStudentsResult = (data) => {
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
                registrationId: row.registrationId,
                classRoom: {
                    id: row.classRoomId,
                    name: row.classRoomName,
                },
            };
        });
    };

    const getCustomSchoolStudents = async (filter) => {
        const { limit, skip } = filter;
        const where = convertWhereFilterToSQL(filter);
        const orderBy = convertOrderByFilterToSQL(filter);

        const sql = `
            SELECT
                DISTINCT ss.*,
                u.username,
                u.email,
                p.firstName,
                p.lastName,
                p.id AS profileId,
                TRIM(CONCAT(p.firstName, " ", p.lastName)) AS fullName,
                s.name AS schoolName
            FROM
                ${users_v1_db}.school_students ss
                INNER JOIN ${users_v1_db}.users u ON ss.userId = u.id
                INNER JOIN ${users_v1_db}.profiles p ON u.id = p.userId
                INNER JOIN ${users_v1_db}.schools s ON ss.schoolId = s.id
            WHERE
                ss.deletedAt IS NULL
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

        return formatCustomSchoolStudentsResult(result);
    };

    const countCustomSchoolStudents = async (filter) => {
        const where = convertWhereFilterToSQL(filter);

        const sql = `
            SELECT
                COUNT(DISTINCT ss.id) AS total
            FROM
                ${users_v1_db}.school_students ss
                INNER JOIN ${users_v1_db}.users u ON ss.userId = u.id
                INNER JOIN ${users_v1_db}.profiles p ON u.id = p.userId
                INNER JOIN ${users_v1_db}.schools s ON ss.schoolId = s.id
            WHERE
                ss.deletedAt IS NULL
                AND u.deletedAt IS NULL
                AND s.deletedAt IS NULL
                ${where}
        `;

        const [data] = await executeQuery(sql);

        return data?.total || 0;
    };

    const getCustomSchoolStudentsWithRegistrations = async (filter) => {
        const { limit, skip } = filter;
        const where = convertWhereFilterToSQL(filter, true);
        const orderBy = convertOrderByFilterToSQL(filter);

        const sql = `
            SELECT
                DISTINCT ss.*,
                sr.id as registrationId,
                u.username,
                u.email,
                p.firstName,
                p.lastName,
                p.id AS profileId,
                TRIM(CONCAT(p.firstName, " ", p.lastName)) AS fullName,
                s.name AS schoolName,
                cr.id AS classRoomId,
                cr.name AS classRoomName
            FROM
                ${users_v1_db}.school_students ss
                INNER JOIN ${users_v1_db}.users u ON ss.userId = u.id
                INNER JOIN ${users_v1_db}.profiles p ON u.id = p.userId
                INNER JOIN ${users_v1_db}.schools s ON ss.schoolId = s.id
                INNER JOIN ${students_v1_db}.student_registrations sr ON sr.studentId = ss.id
                INNER JOIN ${schools_v1_db}.ClassRoom cr ON sr.classRoomId = cr.id
            WHERE
                ss.deletedAt IS NULL
                AND u.deletedAt IS NULL
                AND s.deletedAt IS NULL
                AND sr.deletedAt IS NULL
                AND cr.deletedAt IS NULL
                ${where}
            ORDER BY
                ${orderBy}
            LIMIT
                ${limit}
            OFFSET
                ${skip}
        `;

        const result = await executeQuery(sql);

        return formatCustomSchoolStudentsResult(result);
    };

    const countCustomSchoolStudentsWithRegistrations = async (filter) => {
        const where = convertWhereFilterToSQL(filter, true);

        const sql = `
            SELECT
                COUNT(DISTINCT sr.id) AS total
            FROM
                ${users_v1_db}.school_students ss
                INNER JOIN ${users_v1_db}.users u ON ss.userId = u.id
                INNER JOIN ${users_v1_db}.profiles p ON u.id = p.userId
                INNER JOIN ${users_v1_db}.schools s ON ss.schoolId = s.id
                INNER JOIN ${students_v1_db}.student_registrations sr ON sr.studentId = ss.id
                INNER JOIN ${schools_v1_db}.ClassRoom cr ON sr.classRoomId = cr.id
            WHERE
                ss.deletedAt IS NULL
                AND u.deletedAt IS NULL
                AND s.deletedAt IS NULL
                AND sr.deletedAt IS NULL
                AND cr.deletedAt IS NULL
                ${where}
        `;

        const [data] = await executeQuery(sql);

        return data?.total || 0;
    };

    SchoolStudent.customSearch = async (filter, res) => {
        const [result, count] = await Promise.all([getCustomSchoolStudents(filter), countCustomSchoolStudents(filter)]);

        res.set('x-total-count', count);

        return result;
    };

    SchoolStudent.customSearchWithRegistrations = async (filter, res) => {
        const [result, count] = await Promise.all([
            getCustomSchoolStudentsWithRegistrations(filter),
            countCustomSchoolStudentsWithRegistrations(filter),
        ]);

        res.set('x-total-count', count);

        return result;
    };
};
