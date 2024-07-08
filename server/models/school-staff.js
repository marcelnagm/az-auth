'use strict';
const jwt = require('../lib/jwt');
const ms = require('ms');
const Environment = require('../config/environment');
const { users_v1_db } = require('../../database-config');

module.exports = function (SchoolStaff) {
    SchoolStaff.getType = () => SchoolStaff.app.models.UserType.STAFF;

    const executeQuery = (sql, params = []) => {
        const { dataSources } = SchoolStaff.app;
        const { connector } = dataSources.db;

        return new Promise((resolve, reject) => {
            connector.execute(sql, params, {}, (err, rows) => {
                if (err) return reject(err);

                resolve(rows);
            });
        });
    };

    SchoolStaff.afterRemote('create', (ctx, output, next) => {
        const instance = ctx.req.body;
        const SysUser = SchoolStaff.app.models.SysUser;
        const UserType = SchoolStaff.app.models.UserType;

        SysUser.findById(instance.userId, (err, user) => {
            if (err) return next(err);
            if (!user) {
                const error = new Error(`User with id ${instance.userId} not found`);
                error.status = 422;
                return next(error);
            }

            UserType.findById(2, (err, userType) => {
                if (err) return next(err);
                user.userTypes.add(userType, next);
            });
        });
    });

    SchoolStaff.loginByToken = function (schoolRoleId, request, done) {
        const TTL = ms(Environment.getValue('token_expiration_time')).toString();
        let schoolAccessToken = request.accessToken;

        SchoolStaff.findOne(
            {
                fields: ['id', 'schoolRoleId', 'schoolId'],
                where: { schoolRoleId: schoolRoleId, userId: schoolAccessToken.userId },
            },
            (error, schoolStaff) => {
                if (error) return done(error);
                if (!schoolStaff) return done({ statusCode: 401, name: 'Error', message: 'login failed', code: 'LOGIN_FAILED' });

                const tokenPublic = jwt.verify(request.accessToken.token);
                const brandId = tokenPublic.params && tokenPublic.params.brandId;

                schoolAccessToken.schoolRoleId = schoolStaff.schoolRoleId;
                schoolAccessToken.responsibleId = null;
                schoolAccessToken.studentId = null;
                schoolAccessToken.schoolId = schoolStaff.schoolId;
                schoolAccessToken.userTypeId = SchoolStaff.getType().id;
                schoolAccessToken.created = new Date();

                var bodyJSON = schoolAccessToken.toPlanObject.bind(schoolAccessToken);
                var JWT_TOKEN = jwt.generate({ ...bodyJSON(), brandId }, TTL);
                schoolAccessToken.token = JWT_TOKEN;

                schoolAccessToken.save((err) => {
                    done(null, {
                        accessToken: schoolAccessToken.token,
                        schoolRoleId: schoolStaff.schoolRoleId,
                        schoolId: schoolStaff.schoolId,
                        userId: schoolAccessToken.userId,
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

        if (whereFilter['schoolId']) sqlWhere += `AND s.id = ${whereFilter['schoolId']} `;

        if (whereFilter['schoolRoleId']) sqlWhere += `AND sr.id = ${whereFilter['schoolRoleId']} `;

        return sqlWhere;
    };

    const convertOrderByFilterToSQL = (filter) => {
        const data = filter.order?.split(' ');
        const [column, order] = data;

        const orderBy = {
            'id': 'ss.id',
            'schoolId': 's.id',
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

    const formatSchoolRoleResult = (row) => {
        return {
            name: row.schoolRoleName,
            schoolId: row.schoolId,
            id: row.schoolRoleId,
            createdAt: row.schoolRoleCreatedAt,
            updatedAt: row.schoolRoleUpdatedAt,
        };
    };

    const formatCustomSchoolStaffsResult = (data) => {
        return data.map((row) => {
            return {
                id: row.id,
                staffId: row.staffId,
                schoolId: row.schoolId,
                schoolRoleId: row.schoolRoleId,
                userId: row.userId,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
                user: formatUserResult(row),
                schoolRole: formatSchoolRoleResult(row),
                school: {
                    name: row.schoolName,
                    id: row.schoolId,
                },
            };
        });
    };

    const getCustomSchoolStaffs = async (filter) => {
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
                s.id AS schoolId,
                s.name AS schoolName,
                sr.name AS schoolRolesName,
                sr.createdAt AS schoolRolesCreatedAt,
                sr.updatedAt AS schoolRolesUpdatedAt
            FROM
                ${users_v1_db}.school_staffs ss
                INNER JOIN ${users_v1_db}.users u ON ss.userId = u.id
                INNER JOIN ${users_v1_db}.profiles p ON u.id = p.userId
                INNER JOIN ${users_v1_db}.schools s ON ss.schoolId = s.id
                INNER JOIN ${users_v1_db}.school_roles sr ON ss.schoolRoleId = sr.id
            WHERE
                u.deletedAt IS NULL
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

        return formatCustomSchoolStaffsResult(result);
    };

    const countCustomSchoolStaffs = async (filter) => {
        const where = convertWhereFilterToSQL(filter);

        const sql = `
            SELECT
                COUNT(DISTINCT ss.id) AS total
            FROM
                ${users_v1_db}.school_staffs ss
                INNER JOIN ${users_v1_db}.users u ON ss.userId = u.id
                INNER JOIN ${users_v1_db}.profiles p ON u.id = p.userId
                INNER JOIN ${users_v1_db}.schools s ON ss.schoolId = s.id
                INNER JOIN ${users_v1_db}.school_roles sr ON ss.schoolRoleId = sr.id
            WHERE
                u.deletedAt IS NULL
                AND s.deletedAt IS NULL
                ${where}
        `;

        const [data] = await executeQuery(sql);

        return data?.total || 0;
    };

    SchoolStaff.customSearch = async (filter, res) => {
        const [result, count] = await Promise.all([getCustomSchoolStaffs(filter), countCustomSchoolStaffs(filter)]);

        res.set('x-total-count', count);

        return result;
    };
};
