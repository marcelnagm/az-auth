const { decode } = require('jsonwebtoken');
const Environment = require('../config/environment');

module.exports = function (Env) {
    const getUserByToken = (token) => {
        if (!token) return;

        const decodedToken = decode(token);

        return decodedToken?.params?.userId;
    };

    const isSuperUser = (userId) => {
        const superUsers = Environment.getValue('super_users');

        if (!userId || !superUsers.includes(userId)) return false;

        return true;
    };

    Env.getAll = async (req) => {
        const userId = getUserByToken(req?.headers?.authorization);

        return isSuperUser(userId) ? Environment.getAll() : {};
    };

    Env.reload = async (req) => {
        await Environment.populateAllEnvs();

        const userId = getUserByToken(req?.headers?.authorization);

        return isSuperUser(userId) ? Environment.getAll() : {};
    };
};
