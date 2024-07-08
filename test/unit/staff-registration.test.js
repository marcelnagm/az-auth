const app = require('../../server/server');
const Tester = require('loopback-jester');
const lbJester = new Tester(app);

lbJester.testAll({
    model: 'StaffRegistration',
    required: ['schoolStaffId', 'schoolYearId'],
    relations: {
        hasMany: ['StaffRegistrationSchoolGrade', 'StaffRegistrationSchoolUnit', 'StaffRegistrationClassRoom', 'StaffRegistrationTheme'],
        belongsTo: ['SchoolStaff'],
    },
});
