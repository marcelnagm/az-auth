const databaseEnvironment = process.env.DATABASE_ENVIRONMENT;

const formatDatabaseName = (database) => {
    return !databaseEnvironment || databaseEnvironment === 'prod' ? database : `${databaseEnvironment}_${database}`;
};

const formatBasicResourceName = (isForSQLUse = true) => {
    const nameWithQuotationMarks = {
        true: '`basic-resource-db`',
        false: 'basic-resource-db',
    };

    if (!databaseEnvironment || databaseEnvironment === 'prod') return nameWithQuotationMarks[isForSQLUse];

    return isForSQLUse
        ? `\`${databaseEnvironment}_${nameWithQuotationMarks[false]}\``
        : `${databaseEnvironment}_${nameWithQuotationMarks[false]}`;
};

module.exports = Object.freeze({
    formatBasicResourceName,
    basic_resource: formatBasicResourceName(),
    students_v1_db: formatDatabaseName('students_v1_db'),
    schools_v1_db: formatDatabaseName('schools_v1_db'),
    teacher_db: formatDatabaseName('teacher_db'),
    users_v1_db: formatDatabaseName('users_v1_db'),
});
