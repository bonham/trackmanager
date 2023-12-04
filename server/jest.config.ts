import type { JestConfigWithTsJest } from 'ts-jest'
import preset from 'ts-jest/presets/index.js'

const jestConfig: JestConfigWithTsJest = {
  ...preset.defaultsESM,
  //preset: "ts-jest",
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
      },
    ],
  },
}
export default jestConfig