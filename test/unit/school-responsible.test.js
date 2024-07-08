const app = require('../../server/server');
const Tester = require('loopback-jester');
const lbJester = new Tester(app);

lbJester.testAll({
    model: 'SchoolResponsible',
    required: ['userId', 'schoolId'],
    relations: {
        belongsTo: [{ name: 'user', model: 'SysUser' }, 'School'],
        hasMany: ['SchoolAccessToken'],
    },
});
