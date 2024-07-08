module.exports = {
    up: function (app, next) {
        var createSQL =
            'CREATE TABLE `packages` ( \
      `id` int(11) NOT NULL AUTO_INCREMENT, \
      `name` varchar(255) NOT NULL, \
      `createdAt` datetime DEFAULT NULL, \
      `updatedAt` datetime DEFAULT NULL, \
      `deletedAt` datetime DEFAULT NULL, \
      PRIMARY KEY (`id`) \
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;';

        app.dataSources.db.connector.query(createSQL, next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('DROP TABLE `packages`;', next);
    },
};
