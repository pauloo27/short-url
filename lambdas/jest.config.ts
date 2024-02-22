/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

export default {
    testEnvironment: 'node',
    transform: {
        '^.+\\.ts?$': 'ts-jest',
        '^.+.js?$': 'babel-jest',
    },
    transformIgnorePatterns: ['node_modules/(?!nanoid)'],
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageProvider: 'v8',
    testMatch: ['**/tests/unit/*.spec.ts'],
};
