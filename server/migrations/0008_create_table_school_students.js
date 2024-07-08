module.exports = {
    up: function (app, next) {
        var createSQL =
            'CREATE TABLE `school_students` ( \
      `id` int(11) NOT NULL AUTO_INCREMENT, \
      `studentId` int(11) NOT NULL, \
      `schoolId` int(11) NOT NULL, \
      `userId` int(11) DEFAULT NULL, \
      `createdAt` datetime DEFAULT NULL, \
      `updatedAt` datetime DEFAULT NULL, \
      PRIMARY KEY (`id`), \
      KEY `userId` (`userId`), \
      CONSTRAINT `school_students_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) \
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;';

        app.dataSources.db.connector.query(createSQL, next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('DROP TABLE `school_students`;', next);
    },
};
