const app = require('../../server/server');
const Tester = require('loopback-jester');
const lbJester = new Tester(app);

lbJester.testAll({
    model: 'SysUser',
    required: ['email'],
    relations: {
        hasMany: [{ name: 'accessTokens', model: 'SchoolAccessToken ' }, 'SchoolStudent', 'SchoolStudentResponsible', 'SchoolOwner'],
        hasOne: ['Profile'],
    },
});
