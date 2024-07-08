const getEnvironmentVariable = (environmentVariableName) => {
    const environmentVariable = process.env[environmentVariableName];

    if (!environmentVariable) return;
    return environmentVariable;
};

const localEnvs = {
    debug: getEnvironmentVariable('DEBUG'),
    node_env: getEnvironmentVariable('NODE_ENV'),
    mysql_host: getEnvironmentVariable('MYSQL_HOST'),
    aws_region: getEnvironmentVariable('MYSQL_PASSWORD'),
    mysql_database: getEnvironmentVariable('MYSQL_DATABASE'),
    mysql_password: getEnvironmentVariable('MYSQL_PASSWORD'),
    sendgrid_api_key: getEnvironmentVariable('SENDGRID_API_KEY'),
    aws_access_key_id: getEnvironmentVariable('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key: getEnvironmentVariable('MYSQL_PASSWORD'),
    mysql_connectionlimit: getEnvironmentVariable('MYSQL_CONNECTIONLIMIT'),
};

module.exports = localEnvs;
