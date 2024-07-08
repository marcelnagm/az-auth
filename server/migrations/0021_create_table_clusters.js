module.exports = {
    up: function (app, next) {
        var createSQL =
            'CREATE TABLE `clusters` ( \
      `id` int(11) NOT NULL AUTO_INCREMENT, \
      `name` varchar(512) DEFAULT NULL, \
      `endpoint` varchar(512) DEFAULT NULL, \
      `registryEndpoint` varchar(512) DEFAULT NULL, \
      `k8sCluster` varchar(512) DEFAULT NULL, \
      `awsCrendentials` varchar(512) DEFAULT NULL, \
      `createdAt` datetime DEFAULT NULL, \
      `updatedAt` datetime DEFAULT NULL, \
      PRIMARY KEY (`id`) \
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;';

        app.dataSources.db.connector.query(createSQL, next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('DROP TABLE `clusters`;', next);
    },
};
