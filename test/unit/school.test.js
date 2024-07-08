const app = require('../../server/server');
const Tester = require('loopback-jester');
const lbJester = new Tester(app);

lbJester.testAll({
    model: 'School',
    required: ['name'],
    relations: {
        hasMany: ['SchoolOwner', 'SchoolStudent', 'SchoolAccessToken', 'SchoolResponsible', 'SchoolRole', 'SchoolStaff'],
    },
});
