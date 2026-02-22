const base = require('./jest.config.cjs');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  ...base,
  displayName: 'integration',
  testMatch: ['<rootDir>/src/**/*.integration.test.ts'],
};
