import type { JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
  globals: {
    tsconfig: "./tsconfig-jest.json"
  },
  preset: "ts-jest",
  testEnvironment: "node",
  verbose: true,
  rootDir: ".",
  extensionsToTreatAsEsm: [".ts"],
  transformIgnorePatterns: [
    '/node_modules/(?!(@garmin/fitsdk))',
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: "./tsconfig-jest.json"
      },
    ],
  },
}
export default jestConfig