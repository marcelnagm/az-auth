module.exports = {
    up: function (app, next) {
        var createSQL =
            'CREATE TABLE `apps` ( \
      `id` int(11) NOT NULL AUTO_INCREMENT, \
      `name` varchar(512) DEFAULT NULL, \
      `servicePath` varchar(512) DEFAULT NULL, \
      `description` text DEFAULT NULL, \
      `repositoryUrl` varchar(512) DEFAULT NULL, \
      `createdAt` datetime DEFAULT NULL, \
      `updatedAt` datetime DEFAULT NULL, \
      PRIMARY KEY (`id`) \
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;';

        app.dataSources.db.connector.query(createSQL, next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('DROP TABLE `apps`;', next);
    },
};
