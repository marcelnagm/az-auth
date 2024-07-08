module.exports = {
    db: {
        'connector': 'mysql',
        'name': 'db',
        // 'url': process.env.MYSQL_URL,
        'host': process.env.MYSQL_HOST,
        'database': process.env.MYSQL_DATABASE,
        'user': process.env.MYSQL_USERNAME,
        'password': process.env.MYSQL_PASSWORD,
        'connectionLimit': process.env.MYSQL_CONNECTIONLIMIT,
        'debug': false,
    },
    memory: {
        connector: 'memory',
        name: 'memory',
    },
};
