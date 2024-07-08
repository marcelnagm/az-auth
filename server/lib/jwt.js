const Environment = require('../config/environment');
const jwt = require('jsonwebtoken');
const ms = require('ms');

module.exports = {
    generate: function (params, ttl) {
        try {
            return jwt.sign(
                {
                    params,
                },
                Environment.getValue('jwt_private_key'),
                {
                    expiresIn: ms(Environment.getValue('token_expiration_time')).toString(),
                }
            );
        } catch (err) {
            console.log(`jwt sign error: ${err}`);
        }
    },
    verify: function (jwtToken) {
        try {
            return jwt.verify(jwtToken, Environment.getValue('jwt_private_key'));
        } catch (err) {
            console.log(`jwt verify error: ${err}`);
        }
    },
};
