const ParameterStore = require('../helpers/getParametersFromStore');
const _ = require('lodash');

const VARIABLES_FROM_AWS = [
    'az-user-auth/EMAIL_S3',
    'az-user-auth/EMAIL_FROM',
    'az-user-auth/UI_STAFF_PATH',
    'az-user-auth/UI_STUDENT_PATH',
    'az-user-auth/UI_TEACHER_PATH',
    'az-user-auth/GRAYLOG_APPLICATION',
    'az-user-auth/TOKEN_EXPIRATION_TIME',
    'az-user-auth/GRAYLOG_APPLICATION_NAME',
    'common/SUPER_USERS',
    'common/GRAYLOG_ENVIRONMENT',
    'common/GRAYLOG_HOST',
    'common/GRAYLOG_NAME',
    'common/GRAYLOG_PORT',
    'common/JWT_PRIVATE_KEY',
    'common/X_API_KEY',
];

class GetParametersStore {
    static instance;
    constructor() {
        this.envs = {};
    }

    async populate() {
        const envChunk = _.chunk(VARIABLES_FROM_AWS, 10);
        for (const envList of envChunk) {
            const variables = await ParameterStore.getParametersFromStore(envList);
            for (const key in variables) {
                this.envs[key] = variables[key];
            }
        }
    }

    getAll() {
        const result = {};
        for (const key in this.envs) {
            result[key] = process.env[key] || this.envs[key];
        }

        return result;
    }

    getEnvValue(value) {
        return this.env[value];
    }

    static getInstance() {
        if (!GetParametersStore.instance) {
            GetParametersStore.instance = new GetParametersStore();
        }

        return GetParametersStore.instance;
    }
}

module.exports = GetParametersStore.getInstance();
