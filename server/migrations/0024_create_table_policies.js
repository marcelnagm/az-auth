module.exports = {
    up: function (app, next) {
        var createSQL =
            "CREATE TABLE `policies` ( \
      `id` int(11) NOT NULL AUTO_INCREMENT, \
      `schoolId` int(11) NOT NULL, \
      `appSchoolId` int(11) NOT NULL, \
      `isPublic` tinyint(1) NOT NULL DEFAULT '0', \
      `endpointId` int(11) NOT NULL, \
      `createdAt` datetime DEFAULT NULL, \
      `updatedAt` datetime DEFAULT NULL, \
      PRIMARY KEY (`id`), \
      KEY `endpointId` (`endpointId`), \
      KEY `appSchoolId` (`appSchoolId`), \
      CONSTRAINT `policies_ibfk_1` FOREIGN KEY (`endpointId`) REFERENCES `endpoints` (`id`) ON UPDATE CASCADE, \
      CONSTRAINT `policies_ibfk_2` FOREIGN KEY (`appSchoolId`) REFERENCES `app_schools` (`id`) ON UPDATE CASCADE \
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;";

        app.dataSources.db.connector.query(createSQL, next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('DROP TABLE `policies`;', next);
    },
};
