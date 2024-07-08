module.exports = {
    up: function (app, next) {
        var createSQL =
            'CREATE TABLE `app_version_envs` ( \
        `id` int(11) NOT NULL AUTO_INCREMENT, \
        `envName` varchar(512) NOT NULL, \
        `envValue` text NOT NULL, \
        `appVersionId` int(11) NOT NULL, \
        `createdAt` datetime DEFAULT NULL, \
        `deletedAt` datetime DEFAULT NULL, \
        `updatedAt` datetime DEFAULT NULL, \
        PRIMARY KEY (`id`), \
        KEY `appVersionId` (`appVersionId`), \
        CONSTRAINT `app_version_envs_ibfk_1` FOREIGN KEY (`appVersionId`) REFERENCES `app_versions` (`id`) ON UPDATE CASCADE \
      ) ENGINE=InnoDB  DEFAULT CHARSET=utf8;';

        app.dataSources.db.connector.query(createSQL, next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('DROP TABLE `app_version_envs`;', next);
    },
};
