const app = require('../../server/server');
const Tester = require('loopback-jester');
const lbJester = new Tester(app);

lbJester.testAll({
    model: 'SchoolOwner',
    required: ['schoolId', 'userId'],
    relations: {
        belongsTo: [{ name: 'user', model: 'SysUser' }, 'School'],
    },
});
