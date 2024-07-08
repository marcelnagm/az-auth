const loopbackApiTesting = require('loopback-api-testing-jest');
const tests = require('./acl-test-config.json');
const app = require('../../server/server.js');
const Environment = require('../config/environment');

const url = 'http://localhost:3000/api';
const privateKey = Environment.getValue('jwt_private_key');
const roleKey = require('../../server/component-config.json')['loopback-static-roles'].tokenAttName;
const defaultAuthRole = 'STUDENT';

let opts = { privateKey, app, roleKey, url, beforeAll, defaultAuthRole };
loopbackApiTesting.run(tests, opts, function (err) {
    if (err) {
        console.log(err);
    }
});
