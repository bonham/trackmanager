import { createJsWithTsEsmPreset } from 'ts-jest'

const presetConfig = createJsWithTsEsmPreset({
  tsconfig: 'tsconfig-jest.json'
})

const jestConfig = {
  ...presetConfig,
  testEnvironment: "node",
  verbose: false,
  rootDir: ".",
  testPathIgnorePatterns: ['/dist/'],
  transformIgnorePatterns: [
    '/node_modules/(?!(@garmin/fitsdk))',
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
}
export default jestConfig