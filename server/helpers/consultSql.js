const runExecuteSql = async (dataSource, sql, first = false, values) => {
    return new Promise((resolve, reject) => {
        dataSource.connector.execute(sql, values, (err, rows) => {
            if (err) return reject(err);
            if (first === true) {
                resolve(rows[0]);
            }
            resolve(rows);
        });
    });
};

module.exports = { runExecuteSql };
