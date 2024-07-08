module.exports = {
    up: function (app, next) {
        var createSQL =
            'CREATE TABLE `school_responsibles` ( \
      `id` int(11) NOT NULL AUTO_INCREMENT, \
      `alias` varchar(255) DEFAULT NULL, \
      `active` tinyint(1) DEFAULT NULL, \
      `userId` int(11) NOT NULL, \
      `schoolId` int(11) NOT NULL, \
      `createdAt` datetime DEFAULT NULL, \
      `deletedAt` datetime DEFAULT NULL, \
      `updatedAt` datetime DEFAULT NULL, \
        PRIMARY KEY (`id`) \
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;';

        app.dataSources.db.connector.query(createSQL, next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('DROP TABLE `school_responsibles`;', next);
    },
};
