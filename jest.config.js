module.exports = {
    preset: 'jest-preset-loopback',
    verbose: true,
    collectCoverage: false,
    collectCoverageFrom: ['**/server/models/*.{js,jsx}'],
    coverageThreshold: {
        global: {
            // https://en.wikipedia.org/wiki/Code_coverage
            branches: 50,
            functions: 20,
            lines: 50,
            statements: 50,
        },
    },
};
