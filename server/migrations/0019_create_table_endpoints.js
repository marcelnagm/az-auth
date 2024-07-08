module.exports = {
    up: function (app, next) {
        var createSQL =
            'CREATE TABLE `endpoints` ( \
      `id` int(11) NOT NULL AUTO_INCREMENT, \
      `description` varchar(512) DEFAULT NULL, \
      `method` varchar(512) NOT NULL, \
      `path` varchar(512) NOT NULL, \
      `appVersionId` int(11) DEFAULT NULL, \
      `createdAt` datetime DEFAULT NULL, \
      `updatedAt` datetime DEFAULT NULL, \
      PRIMARY KEY (`id`), \
      KEY `appVersionId` (`appVersionId`), \
      CONSTRAINT `endpoints_ibfk_1` FOREIGN KEY (`appVersionId`) REFERENCES `app_versions` (`id`) ON UPDATE CASCADE \
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;';

        app.dataSources.db.connector.query(createSQL, next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('DROP TABLE `endpoints`;', next);
    },
};
