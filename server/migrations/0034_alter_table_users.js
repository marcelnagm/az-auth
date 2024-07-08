module.exports = {
    up: function (app, next) {
        var createSQL =
            'alter table `users` \
    add `username` varchar(255) NOT NULL,\
    CHANGE `cpf` `cpf` VARCHAR(255) NULL,\
    CHANGE `email` `email` VARCHAR(255) NULL;';
        app.dataSources.db.connector.query(createSQL, next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('\
    alter table `users` \
    drop `username`;', next);
    },
};
