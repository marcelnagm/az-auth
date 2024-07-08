'use strict';
const _ = require('lodash');
module.exports = function (SchoolRole) {
    SchoolRole.getSchoolRole = async (objects, includes) => {
        let options = {
            where: {
                id: {
                    inq: _.map(objects, 'schoolRoleId'),
                },
            },
            include: includes,
        };

        let schoolRole = await SchoolRole.find(options);
        return schoolRole;
    };
};
