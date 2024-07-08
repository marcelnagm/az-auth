module.exports = {
    up: function (app, next) {
        var createSQL =
            'CREATE TABLE `app_schools` ( \
      `id` int(11) NOT NULL AUTO_INCREMENT, \
      `schoolId` int(11) NOT NULL, \
      `packageId` int(11) DEFAULT NULL, \
      `clusterId` int(11) DEFAULT NULL, \
      `createdAt` datetime DEFAULT NULL, \
      `updatedAt` datetime DEFAULT NULL, \
      PRIMARY KEY (`id`), \
      KEY `packageId` (`packageId`), \
      KEY `clusterId` (`clusterId`), \
      CONSTRAINT `packages_ibfk_1` FOREIGN KEY (`packageId`) REFERENCES `app_versions` (`id`) ON UPDATE CASCADE, \
      CONSTRAINT `app_schools_ibfk_2` FOREIGN KEY (`clusterId`) REFERENCES `clusters` (`id`) ON UPDATE CASCADE \
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;';

        app.dataSources.db.connector.query(createSQL, next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('DROP TABLE `app_schools`;', next);
    },
};
