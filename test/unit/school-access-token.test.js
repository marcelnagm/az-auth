const app = require('../../server/server');
const Tester = require('loopback-jester');
const lbJester = new Tester(app);

lbJester.testAll({
    model: 'SchoolAccessToken',
    required: ['userId'],
    relations: {
        belongsTo: [{ name: 'user', model: 'SysUser' }, 'SchoolRole', 'SchoolResponsible', 'School'],
    },
});
