const app = require('../../server/server');
const Tester = require('loopback-jester');
const lbJester = new Tester(app);

lbJester.testAll({
    model: 'StaffRegistrationTheme',
    required: ['staffRegistrationId', 'themeId'],
    relations: {
        belongsTo: ['StaffRegistration'],
    },
});
