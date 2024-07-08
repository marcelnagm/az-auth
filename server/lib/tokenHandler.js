'use strict';
const jwt = require('./jwt');

module.exports = (token, resolve, reject, role, JWT_PRIVATE_KEY, roleAttName) => {
    if (token) {
        if (token.includes('bearer')) {
            const split = token.split(' ');

            if (split.length === 2) {
                token = split[1];
            }
        }
        if (token) {
            const decodeToken = jwt.verify(token);

            if (!decodeToken?.params) {
                return reject();
            }
            return resolve(null, true);
        } else {
            // invalid header
            reject();
        }
    } else {
        // invalid token
        reject();
    }
};
