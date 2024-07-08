module.exports = {
    up: function (app, next) {
        var createTypes = [
            app.models.UserType.SUPERUSER,
            app.models.UserType.PUBLIC,
            app.models.UserType.STAFF,
            app.models.UserType.STUDENT,
            app.models.UserType.RESPONSIBLE,
        ];

        var promises = createTypes.map((object) => {
            var insertSQL = `INSERT INTO user_types (id,name) values (${object.id}, '${object.name}');`;
            return new Promise((resolve) => {
                app.dataSources.db.connector.query(insertSQL, resolve);
            });
        });

        Promise.all(promises)
            .then(() => {
                next();
            })
            .catch(next);
    },
    down: function (app, next) {
        app.dataSources.db.connector.query('DELETE FROM `user_types`;', next);
    },
};
