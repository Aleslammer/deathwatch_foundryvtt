export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.mjs'],
  moduleFileExtensions: ['mjs', 'js'],
  collectCoverageFrom: ['src/module/**/*.mjs'],
  coveragePathIgnorePatterns: ['/node_modules/']
};
