const base = require('./jest.config.cjs');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  ...base,
  displayName: 'unit',
  // Unit tests run fast and avoid any DB-connected suites.
  testPathIgnorePatterns: [
    ...(base.testPathIgnorePatterns || []),
    '<rootDir>/src/__tests__/integration/',
    '<rootDir>/src/__tests__/e2e/',
    '.*\\.integration\\.test\\.ts$',
  ],
};
