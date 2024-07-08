module.exports = {
    up: function (app, next) {
        var createSQL =
            'CREATE TABLE `user_types` ( \
      `id` int(11) NOT NULL AUTO_INCREMENT, \
      `name` varchar(512) DEFAULT NULL, \
      PRIMARY KEY (`id`) \
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;';

        app.dataSources.db.connector.query(createSQL, next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('DROP TABLE `user_types`;', next);
    },
};
