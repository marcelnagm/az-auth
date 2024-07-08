module.exports = {
    up: function (app, next) {
        var createSQL =
            'CREATE TABLE `app_versions` ( \
      `id` int(11) NOT NULL AUTO_INCREMENT, \
      `name` varchar(512) DEFAULT NULL, \
      `branch` varchar(512) DEFAULT NULL, \
      `currentTagName` varchar(512) DEFAULT NULL, \
      `deploySHA` varchar(512) DEFAULT NULL, \
      `status` varchar(512) DEFAULT NULL, \
      `appId` int(11) DEFAULT NULL, \
      `createdAt` datetime DEFAULT NULL, \
      `updatedAt` datetime DEFAULT NULL, \
      PRIMARY KEY (`id`), \
      KEY `appId` (`appId`), \
      CONSTRAINT `app_versions_ibfk_1` FOREIGN KEY (`appId`) REFERENCES `apps` (`id`) ON UPDATE CASCADE \
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;';

        app.dataSources.db.connector.query(createSQL, next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('DROP TABLE `app_versions`;', next);
    },
};
