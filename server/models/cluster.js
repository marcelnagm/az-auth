'use strict';

module.exports = function (Cluster) {
    Cluster.prototype.configure = function (id, done) {
        done(null, { message: 'TODO: configure CI' });
    };
};
