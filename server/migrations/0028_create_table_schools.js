module.exports = {
    up: function (app, next) {
        var createSQL =
            'CREATE TABLE `schools` ( \
        `id` int(11) NOT NULL AUTO_INCREMENT, \
        `name` varchar(250) DEFAULT NULL, \
        `createdAt` datetime DEFAULT NULL, \
        `updatedAt` datetime DEFAULT NULL, \
        `deletedAt` datetime DEFAULT NULL, \
        PRIMARY KEY (`id`) \
      ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;';

        app.dataSources.db.connector.query(createSQL, next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('DROP TABLE `schools`;', next);
    },
};
