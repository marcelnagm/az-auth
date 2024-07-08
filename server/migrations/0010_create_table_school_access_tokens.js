module.exports = {
    up: function (app, next) {
        var createSQL =
            'CREATE TABLE `school_access_tokens` ( \
        `id` varchar(255) NOT NULL, \
        `schoolId` int(11) DEFAULT NULL, \
        `userTypeId` int(11) DEFAULT NULL, \
        `schoolStudentId` int(11) DEFAULT NULL, \
        `schoolResponsibleId` int(11) DEFAULT NULL, \
        `schoolRoleId` int(11) DEFAULT NULL, \
        `responsibleId` int(11) DEFAULT NULL, \
        `applicationId` int(11) DEFAULT NULL, \
        `token` text, \
        `ttl` int(11) DEFAULT NULL, \
        `scopes` text, \
        `created` datetime DEFAULT NULL, \
        `userId` int(11) DEFAULT NULL, \
        `deletedAt` datetime DEFAULT NULL, \
        PRIMARY KEY (`id`), \
        KEY `userTypeId` (`userTypeId`), \
        KEY `userId` (`userId`), \
        KEY `schoolStudentId` (`schoolStudentId`), \
        KEY `schoolRoleId` (`schoolRoleId`), \
        CONSTRAINT `school_access_tokens_ibfk_1` FOREIGN KEY (`userTypeId`) REFERENCES `user_types` (`id`) ON UPDATE CASCADE, \
        CONSTRAINT `school_access_tokens_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE, \
        CONSTRAINT `school_access_tokens_ibfk_3` FOREIGN KEY (`schoolStudentId`) REFERENCES `school_students` (`id`) ON UPDATE CASCADE, \
        CONSTRAINT `school_access_tokens_ibfk_4` FOREIGN KEY (`schoolRoleId`) REFERENCES `school_roles` (`id`) ON UPDATE CASCADE \
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;';

        app.dataSources.db.connector.query(createSQL, next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('DROP TABLE `school_access_tokens`;', next);
    },
};
