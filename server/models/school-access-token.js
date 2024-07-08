'use strict';
const jwt = require('../lib/jwt');

module.exports = function (SchoolAccessToken) {
    SchoolAccessToken.prototype.toPlanObject = function () {
        var newData = { ...this.__data };
        delete newData.token;

        newData['userType'] = SchoolAccessToken.app.models.UserType.getRoleById(newData.userTypeId);

        return newData;
    };

    let getIdForRequest = SchoolAccessToken.getIdForRequest;
    SchoolAccessToken.getIdForRequest = function (req, options) {
        var id = getIdForRequest.apply(this, arguments);
        if (!id) return null;

        try {
            var jwtToken = jwt.verify(id);
            return jwtToken.params.id;
        } catch (e) {
            return null;
        }
    };
};
