const { SSMClient, GetParametersCommand } = require('@aws-sdk/client-ssm');

const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';
const regionKey = process.env.AWS_REGION || 'sa-east-1';

class ParameterStore {
    constructor() {
        this.ssmClient = new SSMClient({
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
            region: regionKey,
        });
    }

    formatValuesByEnvironment(values) {
        const environment = process.env.DATABASE_ENVIRONMENT?.toLocaleLowerCase();
        const environmentValue = ['production', 'prod', 'prd', null, undefined].includes(environment) ? 'prd' : environment;
        const newListOfValues = values.map((value) => `/${environmentValue}/${value}`);

        return newListOfValues;
    }

    formatKeys(name) {
        return name.split('/').slice(-1).join('').toLocaleLowerCase();
    }

    async getParametersFromStore(params) {
        const command = new GetParametersCommand({
            Names: this.formatValuesByEnvironment(params),
            WithDecryption: false,
        });

        try {
            const response = await this.ssmClient.send(command);
            const parameters = response.Parameters;

            if (parameters) {
                const result = {};
                for (const parameter of parameters) {
                    result[this.formatKeys(parameter.Name)] = parameter.Value;
                }
                return result;
            }
        } catch (error) {
            console.error('Erro ao obter os parâmetros:', error);
            return error.trace;
        }
    }
}

module.exports = new ParameterStore();
