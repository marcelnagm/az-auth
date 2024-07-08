module.exports = {
    up: function (app, next) {
        var createSQL =
            'CREATE TABLE `staff_registration_class_rooms` ( \
      `id` int(11) unsigned NOT NULL AUTO_INCREMENT, \
      `staffRegistrationId` int(11) DEFAULT NULL, \
      `classRoomId` int(11) DEFAULT NULL, \
      `createdAt` datetime DEFAULT NULL, \
      `updatedAt` datetime DEFAULT NULL, \
      `deletedAt` datetime DEFAULT NULL, \
      PRIMARY KEY (`id`) \
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;';

        app.dataSources.db.connector.query(createSQL, next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('DROP TABLE `staff_registration_class_rooms`;', next);
    },
};
