module.exports = {
    up: function (app, next) {
        var createSQL =
            'CREATE TABLE `school_student_responsibles` ( \
      `id` int(11) NOT NULL AUTO_INCREMENT, \
      `responsibleId` int(11) NOT NULL, \
      `schoolStudentId` int(11) DEFAULT NULL, \
      `userId` int(11) DEFAULT NULL, \
      PRIMARY KEY (`id`), \
      KEY `schoolStudentId` (`schoolStudentId`), \
      KEY `userId` (`userId`), \
      CONSTRAINT `school_student_responsibles_ibfk_1` FOREIGN KEY (`schoolStudentId`) REFERENCES `school_students` (`id`), \
      CONSTRAINT `school_student_responsibles_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) \
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;';

        app.dataSources.db.connector.query(createSQL, next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('DROP TABLE `school_student_responsibles`;', next);
    },
};
