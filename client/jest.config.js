// Sync object
/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  verbose: false,
  transformIgnorePatterns: ['/node_modules/(?!(ol.*|quick-lru)/)'],

  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.vue$': "@vue/vue2-jest" 
  },

  moduleNameMapper: {
    '@/(.*)$': '<rootDir>/src/$1'
  },

  moduleFileExtensions: [
    'js',
    'json',
    'vue'
  ],

  preset: '@vue/cli-plugin-unit-jest',

  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,vue}',
    '!src/main.js' // No need to cover bootstrap file
  ],
  coverageReporters: ['clover', 'json', 'lcov', 'text']
}

module.exports = config
