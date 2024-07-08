module.exports = {
    up: function (app, next) {
        var createSQL =
            'CREATE TABLE `endpoints_interfaces` ( \
        `id` int(11) NOT NULL AUTO_INCREMENT, \
        `endpointId` int(11) DEFAULT NULL, \
        `interfaceId` varchar(512) DEFAULT NULL, \
        PRIMARY KEY (`id`) \
      ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;';

        app.dataSources.db.connector.query(createSQL, next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('DROP TABLE `endpoints_interfaces`;', next);
    },
};
