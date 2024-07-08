'use strict';
const _ = require('lodash');
const { users_v1_db } = require('../../database-config');
module.exports = function (Profile) {
    Profile.getFullName = function (profile) {
        return `${profile.firstName} ${profile.lastName || ''}`.trim();
    };

    Profile.customQuery = function (obj) {
        let sql = ``;
        if (obj.like) {
            sql += ` AND CONCAT(${users_v1_db}.profiles.firstName, " ", ${users_v1_db}.profiles.lastName) like ?`;
        }
        return { sql, values: [obj.like] };
    };

    Profile.getProfile = async (objects, includes) => {
        let options = {
            where: {
                userId: {
                    inq: _.map(objects, 'id'),
                },
            },
            include: includes,
        };

        let profiles = await Profile.find(options);
        return profiles;
    };
};
