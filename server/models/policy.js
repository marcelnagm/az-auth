// const fetch = require('node-fetch');
// const {
//   createPath,
//   getAllPaths,
// } = require('../dynamo/controllers/path.controller');
// const Path = require('../dynamo/models/path.model');

module.exports = async (Policy) => {
    // Policy.observe('access', async (ctx) => {

    // });

    Policy.observe('before save', async (ctx) => {
        const body = ctx.instance;

        const app = Policy.app;
        const Endpoint = app.models.Endpoint;

        const endpoint = await Endpoint.findById(body.endpointId);

        if (!endpoint) {
            throw new Error('Endpoint not found');
        }

        const AppVersion = app.models.AppVersion;

        const appVersion = await AppVersion.findById(endpoint.appVersionId);

        if (!appVersion) {
            throw new Error('Application Version not found');
        }
    });

    Policy.observe('after save', async (ctx) => {
        const body = ctx.instance;

        const app = Policy.app;
        const Endpoint = app.models.Endpoint;

        const endpoint = await Endpoint.findById(body.endpointId);

        const AppVersion = app.models.AppVersion;

        const appVersion = await AppVersion.findById(endpoint.appVersionId);

        // depois de salvo, pegar id do
        // chamar função createPath passando o path como parâmetro

        // Código dando timeout
        // getAllPaths().then((paths) => {
        //   console.log(paths)
        // }).catch((err) => {
        //   console.log(err)
        // });

        // Código dando timeout - usando o model diretamente
        // const path = new Path({
        //   path: '/servicePrivate',
        //   method: 'GET',
        //   forwardTo: 'http://google.com',
        //   systemId: 1,
        //   schoolId: 1,
        //   roles: [],
        //   onlyUserTypes: [
        //     'OWNER',
        //   ],
        //   isPublic: false,
        // });

        // path.save((err) => {
        //   if (err) { return console.log(err); }
        //   console.log('salvo com sucesso!');
        // });
    });
};
