module.exports = {
    up: function (app, next) {
        var createSQL =
            'CREATE TABLE `policies_user_types` ( \
        `id` int(11) NOT NULL AUTO_INCREMENT, \
        `userTypeId` int(11) NOT NULL, \
        `policyId` int(11) DEFAULT NULL, \
        PRIMARY KEY (`id`), \
        KEY `policyId` (`policyId`), \
        CONSTRAINT `policies_user_types_ibfk_1` FOREIGN KEY (`policyId`) REFERENCES `policies` (`id`) ON UPDATE CASCADE \
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;';

        app.dataSources.db.connector.query(createSQL, next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('DROP TABLE `policies_user_types`;', next);
    },
};
