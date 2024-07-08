'use strict';

module.exports = function (Usertypes) {
    const data = {
        1: 'SUPERUSER',
        2: 'STAFF',
        3: 'STUDENT',
        4: 'RESPONSIBLE',
        5: 'PUBLIC',
        6: 'TEACHER',
    };

    Object.keys(data).forEach((id) => {
        let roleName = data[id];
        Usertypes[roleName] = { id: parseInt(id), name: roleName };
    });

    Usertypes.getRoleById = function (id) {
        return data[id];
    };
};
