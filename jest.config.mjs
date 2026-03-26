export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.mjs'],
  moduleFileExtensions: ['mjs', 'js'],
  setupFiles: ['./tests/setup.mjs'],
  collectCoverageFrom: [
    'src/module/**/*.mjs',
    '!src/module/helpers/foundry-adapter.mjs'
  ],
  coveragePathIgnorePatterns: ['/node_modules/'],
  coverageReporters: ['text', 'text-summary', 'json']
};
