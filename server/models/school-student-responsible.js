'use strict';
const jwt = require('../lib/jwt');
const ms = require('ms');
const Environment = require('../config/environment');
const { users_v1_db } = require('../../database-config');

module.exports = function (Schoolstudentresponsible) {
    Schoolstudentresponsible.getType = () => Schoolstudentresponsible.app.models.UserType.RESPONSIBLE;

    const executeQuery = (sql, params = []) => {
        const { dataSources } = Schoolstudentresponsible.app;
        const { connector } = dataSources.db;

        return new Promise((resolve, reject) => {
            connector.execute(sql, params, {}, (err, rows) => {
                if (err) return reject(err);

                resolve(rows);
            });
        });
    };

    Schoolstudentresponsible.afterRemote('create', (ctx, output, next) => {
        const instance = ctx.req.body;
        const SysUser = Schoolstudentresponsible.app.models.SysUser;
        const UserType = Schoolstudentresponsible.app.models.UserType;
        console.log('instance ', instance);
        SysUser.findById(instance.userId, (err, user) => {
            if (err) return next(err);
            if (!user) {
                const error = new Error(`User with id ${instance.userId} not found`);
                error.status = 422;
                return next(error);
            }

            UserType.findById(4, (err, userType) => {
                if (err) return next(err);
                console.log(`Adding userType ${userType} to user ${instance.userId}`);
                user.userTypes.add(userType, next);
            });
        });
    });

    Schoolstudentresponsible.loginByToken = function (schoolId, request, done) {
        const TTL = ms(Environment.getValue('token_expiration_time')).toString();
        let schoolAccessToken = request.accessToken;
        if (!schoolAccessToken)
            return done({
                statusCode: 422,
                name: 'Error',
                message: 'Access Token in request is null or undefined',
                code: 'NO_ACCESS_TOKEN',
            });
        let params = { schoolId: schoolId, userId: request.accessToken.userId };
        Schoolstudentresponsible.findOne(
            {
                fields: ['id', 'schoolId'],
                where: params,
            },
            (error, schoolStudentResponsible) => {
                if (error) return done(error);
                if (!schoolStudentResponsible)
                    return done({ statusCode: 401, name: 'Error', message: 'login failed', code: 'LOGIN_FAILED' });

                schoolAccessToken.schoolRoleId = null;
                schoolAccessToken.responsibleId = null;
                schoolAccessToken.schoolStudentResponsibleId = schoolStudentResponsible.id;
                schoolAccessToken.schoolStudentId = schoolStudentResponsible.schoolStudentId;
                schoolAccessToken.schoolId = schoolStudentResponsible.schoolId;
                schoolAccessToken.userTypeId = Schoolstudentresponsible.getType().id;
                schoolAccessToken.created = new Date();

                const tokenPublic = jwt.verify(request.accessToken.token);
                const brandId = tokenPublic.params && tokenPublic.params.brandId;

                var bodyJSON = schoolAccessToken.toPlanObject.bind(schoolAccessToken)();
                var JWT_TOKEN = jwt.generate({ ...bodyJSON, brandId }, TTL);
                schoolAccessToken.token = JWT_TOKEN;

                schoolAccessToken.save((err) => {
                    done(null, {
                        accessToken: schoolAccessToken.token,
                        schoolStudentResponsible: schoolAccessToken.schoolStudentResponsible,
                        schoolId: schoolStudentResponsible.schoolId,
                        userId: request.accessToken.userId,
                        ttl: TTL,
                    });
                });
            }
        );
    };

    const convertWhereFilterToSQL = (filter) => {
        const { where: whereFilter } = filter;
        let sqlWhere = '';

        if (whereFilter['profile.fullName'])
            sqlWhere += `AND CONCAT(p.firstName, " ", p.lastName) LIKE "${whereFilter['profile.fullName']?.like}" `;

        if (whereFilter['user.username']) sqlWhere += `AND u.username LIKE "${whereFilter['user.username']?.like}" `;

        if (whereFilter['schoolId']) sqlWhere += `AND ss.schoolId = ${whereFilter['schoolId']} `;

        return sqlWhere;
    };

    const convertOrderByFilterToSQL = (filter) => {
        const data = filter.order?.split(' ');
        const [column, order] = data;

        const orderBy = {
            'id': 'ssr.id',
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
            email: row.email,
            username: row.username,
            id: row.userId,
            profile: formatProfileResult(row),
        };
    };

    const formatSchoolStudentProfileResult = (row) => {
        return {
            firstName: row.studentFirstName,
            lastName: row.studentLastName,
            userId: row.studentProfileUserId,
            id: row.studentProfileId,
            fullName: row.studentFullName,
        };
    };

    const formatSchoolStudentUserResult = (row) => {
        return {
            email: row.studentEmail,
            username: row.studentUsername,
            id: row.studentUserId,
            profile: formatSchoolStudentProfileResult(row),
        };
    };

    const formatSchoolStudentResult = (row) => {
        return {
            schoolId: row.studentSchoolId,
            userId: row.studentUserId,
            id: row.studentId,
            deletedAt: row.studentDeletedAt,
            createdAt: row.studentCreatedAt,
            updatedAt: row.studentUpdatedAt,
            user: formatSchoolStudentUserResult(row),
        };
    };

    const formatCustomSchoolStudentResponsibleResult = (data) => {
        return data.map((row) => {
            return {
                id: row.id,
                schoolStudentId: row.schoolStudentId,
                userId: row.userId,
                alias: row.alias,
                kinship: row.kinship,
                schoolId: row.schoolId,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
                deletedAt: row.deletedAt,
                user: formatUserResult(row),
                schoolStudent: formatSchoolStudentResult(row),
                school: {
                    name: row.schoolName,
                    id: row.schoolId,
                },
            };
        });
    };

    const getCustomSchoolStudentResponsibles = async (filter) => {
        const { limit, skip } = filter;
        const where = convertWhereFilterToSQL(filter);
        const orderBy = convertOrderByFilterToSQL(filter);

        const sql = `
            SELECT
                DISTINCT ssr.*,
                u.id AS userId,
                u.username,
                u.email,
                p.firstName,
                p.lastName,
                p.userId AS profileUserId,
                p.id AS profileId,
                TRIM(CONCAT(p.firstName, " ", p.lastName)) AS fullName,
                ss.id AS studentId,
                ss.schoolId AS studentSchoolId,
                ss.createdAt AS studentCreatedAt,
                ss.updatedAt AS studentUpdatedAt,
                ss.deletedAt AS studentDeletedAt,
                u_student.id AS studentUserId,
                u_student.username AS studentUsername,
                u_student.email AS studentEmail,
                p_student.firstName AS studentFirstName,
                p_student.lastName AS studentLastName,
                p_student.userId AS studentProfileUserId,
                p_student.id AS studentProfileId,
                TRIM(
                    CONCAT(p_student.firstName, " ", p_student.lastName)
                ) AS studentFullName,
                s.id AS schoolId,
                s.name AS schoolName
            FROM
                ${users_v1_db}.school_student_responsibles ssr
                INNER JOIN ${users_v1_db}.users u ON ssr.userId = u.id
                INNER JOIN ${users_v1_db}.profiles p ON u.id = p.userId
                INNER JOIN ${users_v1_db}.school_students ss ON ssr.schoolStudentId = ss.id
                INNER JOIN ${users_v1_db}.users u_student ON ss.userId = u_student.id
                INNER JOIN ${users_v1_db}.profiles p_student ON u_student.id = p_student.userId
                INNER JOIN ${users_v1_db}.schools s ON ss.schoolId = s.id
            WHERE
                ssr.deletedAt IS NULL
                AND u.deletedAt IS NULL
                AND ss.deletedAt IS NULL
                AND u_student.deletedAt IS NULL
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

        return formatCustomSchoolStudentResponsibleResult(result);
    };

    const countCustomSchoolStudentResponsibles = async (filter) => {
        const where = convertWhereFilterToSQL(filter);

        const sql = `
            SELECT
                COUNT(DISTINCT ssr.id) AS total
            FROM
                ${users_v1_db}.school_student_responsibles ssr
                INNER JOIN ${users_v1_db}.users u ON ssr.userId = u.id
                INNER JOIN ${users_v1_db}.profiles p ON u.id = p.userId
                INNER JOIN ${users_v1_db}.school_students ss ON ssr.schoolStudentId = ss.id
                INNER JOIN ${users_v1_db}.users u_student ON ss.userId = u_student.id
                INNER JOIN ${users_v1_db}.profiles p_student ON u_student.id = p_student.userId
            WHERE
                ssr.deletedAt IS NULL
                AND u.deletedAt IS NULL
                AND ss.deletedAt IS NULL
                AND u_student.deletedAt IS NULL
                ${where}
        `;

        const [data] = await executeQuery(sql);

        return data?.total || 0;
    };

    Schoolstudentresponsible.customSearch = async (filter, res) => {
        const [result, count] = await Promise.all([
            getCustomSchoolStudentResponsibles(filter),
            countCustomSchoolStudentResponsibles(filter),
        ]);

        res.set('x-total-count', count);

        return result;
    };
};
