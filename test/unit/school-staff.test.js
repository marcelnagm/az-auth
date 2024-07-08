const app = require('../../server/server');
const Tester = require('loopback-jester');
const lbJester = new Tester(app);

lbJester.testAll({
    model: 'SchoolStaff',
    required: ['schoolId', 'userId', 'schoolRoleId'],
    relations: {
        belongsTo: ['SchoolRole', 'School'],
        hasMany: ['StaffRegistration'],
    },
});
