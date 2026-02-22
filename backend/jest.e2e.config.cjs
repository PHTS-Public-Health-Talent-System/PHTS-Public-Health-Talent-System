const base = require('./jest.config.cjs');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  ...base,
  displayName: 'e2e',
  testMatch: ['<rootDir>/src/**/*.e2e.test.ts'],
};
