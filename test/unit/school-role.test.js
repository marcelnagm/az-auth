const app = require('../../server/server');
const Tester = require('loopback-jester');
const lbJester = new Tester(app);

lbJester.testAll({
    model: 'SchoolRole',
    required: ['name', 'schoolId'],
    relations: {
        hasMany: ['SchoolAccessToken', 'SchoolStaff'],
        belongsTo: ['School'],
    },
});
