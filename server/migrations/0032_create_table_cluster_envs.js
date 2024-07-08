module.exports = {
    up: function (app, next) {
        var createSQL =
            'CREATE TABLE `cluster_envs` ( \
        `id` int(11) NOT NULL AUTO_INCREMENT, \
        `envName` varchar(512) NOT NULL, \
        `envValue` text NOT NULL, \
        `clusterId` int(11) NOT NULL, \
        `createdAt` datetime DEFAULT NULL, \
        `deletedAt` datetime DEFAULT NULL, \
        `updatedAt` datetime DEFAULT NULL, \
        PRIMARY KEY (`id`), \
        KEY `clusterId` (`clusterId`), \
        CONSTRAINT `cluster_envs_ibfk_1` FOREIGN KEY (`clusterId`) REFERENCES `clusters` (`id`) ON UPDATE CASCADE \
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;';

        app.dataSources.db.connector.query(createSQL, next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('DROP TABLE `cluster_envs`;', next);
    },
};
