'use strict';

module.exports = function (Auth) {
    Auth.findAll = function (req, done) {
        console.log('Body', req.body);
        console.log('AccessToken', req.accessToken);
        console.log('Query', req.query);
        console.log('Headers', req.headers);
        done(null, {});
    };
};
