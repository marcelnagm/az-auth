module.exports = {
    up: function (app, next) {
        var createSQL =
            'CREATE TABLE `staff_registrations` ( \
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT, \
        `schoolYearId` int(11) DEFAULT NULL, \
        `schoolStaffId` int(11) DEFAULT NULL, \
        `createdAt` datetime DEFAULT NULL, \
        `updatedAt` datetime DEFAULT NULL, \
        `deletedAt` datetime DEFAULT NULL, \
        PRIMARY KEY (`id`) \
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;';

        app.dataSources.db.connector.query(createSQL, next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('DROP TABLE `staff_registrations`;', next);
    },
};
