const app = require('../../server/server');
const Tester = require('loopback-jester');
const lbJester = new Tester(app);

lbJester.testAll({
    model: 'StaffRegistrationSchoolGrade',
    required: ['staffRegistrationId', 'schoolGradeId'],
    relations: {
        belongsTo: ['StaffRegistration'],
    },
});
