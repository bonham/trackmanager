import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: [".ts"],
  verbose: true,
  roots: [
    './tests',
    './src',
  ],
  testMatch: [
    '**/*.spec.(js|ts)'
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.json'
      },
    ],
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@garmin/fitsdk))"
  ],
  collectCoverage: false,
  collectCoverageFrom: [
    "**/*.{js,vue}",
    "!.eslintrc.js"
  ],
  coverageReporters: [
    "clover",
    "json",
    "lcov",
    "text-summary"
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/coverage/"
  ],
};
export default jestConfig