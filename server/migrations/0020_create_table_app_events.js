module.exports = {
    up: function (app, next) {
        var createSQL =
            'CREATE TABLE `app_events` ( \
      `id` int(11) NOT NULL AUTO_INCREMENT, \
      `eventId` int(11) NOT NULL, \
      `appVersionId` int(11) DEFAULT NULL, \
      `endpointId` int(11) DEFAULT NULL, \
      `createdAt` datetime DEFAULT NULL, \
      `updatedAt` datetime DEFAULT NULL, \
      PRIMARY KEY (`id`), \
      KEY `appVersionId` (`appVersionId`), \
      KEY `endpointId` (`endpointId`), \
      CONSTRAINT `app_events_ibfk_1` FOREIGN KEY (`appVersionId`) REFERENCES `app_versions` (`id`) ON UPDATE CASCADE, \
      CONSTRAINT `app_events_ibfk_2` FOREIGN KEY (`endpointId`) REFERENCES `endpoints` (`id`) ON UPDATE CASCADE \
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;';

        app.dataSources.db.connector.query(createSQL, next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('DROP TABLE `app_events`;', next);
    },
};
