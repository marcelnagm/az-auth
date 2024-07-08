module.exports = {
    up: function (app, next) {
        var createSQL =
            'CREATE TABLE `packages_app_versions` ( \
        `id` int(11) NOT NULL AUTO_INCREMENT, \
        `packageId` int(11) NOT NULL, \
        `appVersionId` int(11) NOT NULL, \
        PRIMARY KEY (`id`), \
        KEY `packageId` (`packageId`), \
        KEY `appVersionId` (`appVersionId`), \
        CONSTRAINT `packages_app_versions_ibfk_1` FOREIGN KEY (`packageId`) REFERENCES `packages` (`id`) ON UPDATE CASCADE, \
        CONSTRAINT `packages_app_versions_ibfk_2` FOREIGN KEY (`appVersionId`) REFERENCES `app_versions` (`id`) ON UPDATE CASCADE \
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;';

        app.dataSources.db.connector.query(createSQL, next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('DROP TABLE `packages_app_versions`;', next);
    },
};
