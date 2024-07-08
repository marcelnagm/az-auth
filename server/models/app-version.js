'use strict';

module.exports = function (AppVersion) {
    AppVersion.prototype.deploy = function (id, done) {
        done(null, { message: 'TODO: deploy APP to clusters' });
    };

    AppVersion.prototype.buildVersion = function () {
        // https://circleci.com/api/v1.1/project/:vcs-type/:username/:project/tree/:branch?circle-token=:token
        /*{
      "parallel": 2, //optional, default null
      "revision": "f1baeb913288519dd9a942499cef2873f5b1c2bf" // optional
      "build_parameters": { // optional
        "RUN_EXTRA_TESTS": "true"
      }
    }*/
    };

    AppVersion.prototype.promove = function (version, done) {
        done(null, { message: 'TODO: deploy APP to clusters' });
    };
};
