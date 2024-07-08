'use strict';
const jwt = require('../lib/jwt');
const Environment = require('../config/environment');
const ms = require('ms');
const _ = require('lodash');
module.exports = function (School) {
    School.prototype.loginByToken = function (request, done) {
        let SysUser = School.app.models.SysUser;
        let schoolAccessToken = request.accessToken;
        let self = this;
        const TTL = ms(Environment.getValue('token_expiration_time')).toString();

        SysUser.findById(schoolAccessToken.userId)
            .then((user) => {
                return user.userTypes(
                    {
                        where: { id: SysUser.app.models.UserType.SUPERUSER.id },
                    },
                    (error, resType) => {
                        if (error) return done(error);
                        if (!resType) return done({ statusCode: 401, name: 'Error', message: 'login failed', code: 'LOGIN_FAILED' });

                        schoolAccessToken.schoolRoleId = undefined;
                        schoolAccessToken.responsibleId = undefined;
                        schoolAccessToken.studentId = undefined;
                        schoolAccessToken.schoolId = self.id;
                        schoolAccessToken.userTypeId = SysUser.app.models.UserType.SUPERUSER.id;
                        schoolAccessToken.created = new Date();

                        var bodyJSON = schoolAccessToken.toPlanObject.bind(schoolAccessToken);
                        var JWT_TOKEN = jwt.generate(bodyJSON(), TTL);
                        schoolAccessToken.token = JWT_TOKEN;

                        schoolAccessToken.save((error) => {
                            if (error) return done(error);
                            done(null, {
                                accessToken: schoolAccessToken.token,
                                schoolId: self.id,
                                userId: schoolAccessToken.userId,
                                ttl: TTL,
                            });
                        });
                    }
                );
            })
            .catch(done);
    };

    School.getSchool = async function (objects, includes) {
        let options = {
            where: {
                id: {
                    inq: _.map(objects, 'schoolId'),
                },
            },
            include: includes,
        };

        let schools = await School.find(options);
        return schools;
    };
};
