export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.mjs'],
  moduleFileExtensions: ['mjs', 'js'],
  collectCoverageFrom: [
    'src/module/**/*.mjs',
    '!src/module/helpers/foundry-adapter.mjs'
  ],
  coveragePathIgnorePatterns: ['/node_modules/']
};
