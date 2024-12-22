import preset from 'ts-jest/presets/index.js'

const jestConfig = {
  ...preset.defaultsESM,
  testEnvironment: "node",
  verbose: false,
  rootDir: ".",
  extensionsToTreatAsEsm: [".ts"],
  testPathIgnorePatterns: ['/dist/'],
  // transformIgnorePatterns: [
  //   '/node_modules/(?!(@garmin/fitsdk))',
  // ],
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