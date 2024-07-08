module.exports = {
    up: function (app, next) {
        var createSQL =
            'CREATE TABLE `user_types_users` (\
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT,\
        `userTypeId` int(11) NOT NULL,\
        `sysUserId` int(11) NOT NULL,\
        PRIMARY KEY (`id`),\
        KEY `userTypeId` (`userTypeId`),\
        KEY `sysUserId` (`sysUserId`),\
        CONSTRAINT `user_types_users_ibfk_1` FOREIGN KEY (`userTypeId`) REFERENCES `user_types` (`id`) ON UPDATE CASCADE,\
        CONSTRAINT `user_types_users_ibfk_2` FOREIGN KEY (`sysUserId`) REFERENCES `users` (`id`) ON UPDATE CASCADE\
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;';

        app.dataSources.db.connector.query(createSQL, next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('DROP TABLE `user_types_users`;', next);
    },
};
