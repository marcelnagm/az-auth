module.exports = {
    up: function (app, next) {
        var createSQL =
            'CREATE TABLE `users` ( \
        `id` int(11) NOT NULL AUTO_INCREMENT, \
        `password` varchar(512) NOT NULL, \
        `email` varchar(512) NOT NULL, \
        `cpf` varchar(512) NOT NULL, \
        `verificationToken` varchar(512) DEFAULT NULL, \
        `createdAt` datetime DEFAULT NULL, \
        `updatedAt` datetime DEFAULT NULL, \
        PRIMARY KEY (`id`) \
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;';

        app.dataSources.db.connector.query(createSQL, next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('DROP TABLE `users`;', next);
    },
};
