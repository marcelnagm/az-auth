module.exports = {
    up: function (app, next) {
        var createSQL =
            'CREATE TABLE `school_staffs` ( \
        `id` int(11) NOT NULL AUTO_INCREMENT, \
        `staffId` int(11) NOT NULL, \
        `schoolId` int(11) NOT NULL, \
        `schoolRoleId` int(11) DEFAULT NULL, \
        `userId` int(11) DEFAULT NULL, \
        `createdAt` datetime DEFAULT NULL, \
        `updatedAt` datetime DEFAULT NULL, \
        PRIMARY KEY (`id`), \
        KEY `schoolRoleId` (`schoolRoleId`), \
        KEY `userId` (`userId`), \
        CONSTRAINT `school_staffs_ibfk_1` FOREIGN KEY (`schoolRoleId`) REFERENCES `school_roles` (`id`) ON UPDATE CASCADE, \
        CONSTRAINT `school_staffs_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE \
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;';

        app.dataSources.db.connector.query(createSQL, next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('DROP TABLE `school_staffs`;', next);
    },
};
