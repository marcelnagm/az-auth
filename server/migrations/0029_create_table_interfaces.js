module.exports = {
    up: function (app, next) {
        var createSQL =
            'CREATE TABLE `interfaces` ( \
        `id` int(11) NOT NULL AUTO_INCREMENT, \
        `location` varchar(512) DEFAULT NULL, \
        `action` varchar(512) DEFAULT NULL, \
        `content` varchar(512) DEFAULT NULL, \
        `createdAt` datetime DEFAULT NULL, \
        `updatedAt` datetime DEFAULT NULL, \
        `deletedAt` datetime DEFAULT NULL, \
        PRIMARY KEY (`id`) \
      ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;';

        app.dataSources.db.connector.query(createSQL, next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('DROP TABLE `interfaces`;', next);
    },
};
