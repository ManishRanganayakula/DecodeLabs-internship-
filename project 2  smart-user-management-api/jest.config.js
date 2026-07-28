module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEach: [],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/server.js', '!src/docs/**'],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 20000,
};
