'use strict';
const Environment = require('../config/environment');
const handleToken = require('./tokenHandler');

module.exports = function (app, options) {
    var Role = app.models.Role;
    const JWT_PRIVATE_KEY = Environment.getValue('jwt_private_key');

    const roleAttName = options && options.tokenAttName ? options.tokenAttName : 'user_type';

    function handleRole(role, ctx, cb) {
        function reject() {
            process.nextTick(function () {
                cb(null, false);
            });
        }

        const req = ctx.remotingContext.req;

        let token = req.headers.Authorization || req.headers.authorization || req.query.access_token;

        handleToken(token, cb, reject, role, JWT_PRIVATE_KEY, roleAttName);
    }

    if (options.roles) {
        options.roles.forEach((role) => {
            Role.registerResolver(role, handleRole);
        });
    } else {
        throw new Error('You need to declare the roles in the component config.');
    }
};
