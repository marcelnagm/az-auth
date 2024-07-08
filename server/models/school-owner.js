'use strict';

module.exports = function (SchoolOwner) {
    SchoolOwner.getType = () => SchoolOwner.app.models.UserType.SUPERUSER;
};
