'use strict';
require('dd-trace').init({
    logInjection: true,
});

require('dotenv').config({ path: `${process.env.ENV_FILE_PATH}` });
var loopback = require('loopback');
var boot = require('loopback-boot');
var bodyParser = require('body-parser');
var Environment = require('./config/environment');
var app = (module.exports = loopback());

// to support JSON-encoded bodies
app.middleware('parse', bodyParser.json());
// to support URL-encoded bodies
app.middleware(
    'parse',
    bodyParser.urlencoded({
        extended: true,
    })
);

app.start = async () => {
    await Environment.populateAllEnvs();
    // start the web server
    return app.listen(() => {
        app.emit('started');
        var baseUrl = app.get('url').replace(/\/$/, '');
        console.log('Web server listening at: %s', baseUrl);
        if (app.get('loopback-component-explorer')) {
            var explorerPath = app.get('loopback-component-explorer').mountPath;
            console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
        }
    });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, (err) => {
    if (err) throw err;

    // start the server if `$ node server.js`
    if (require.main === module) app.start();
});
