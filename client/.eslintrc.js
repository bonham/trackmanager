/* eslint-disable quote-props */
module.exports = {
  root: true,

  env: {
    browser: true,
    jest: true
  },

  extends: [
    'eslint:recommended',
    'plugin:vue/recommended',
    '@vue/standard'
  ],

  parserOptions: {
    parser: '@babel/eslint-parser'
  },

  plugins: [
    'vue'
  ],

  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
  },

  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)'
      ],
      env: {
        jest: true
      }
    },
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)'
      ],
      env: {
        jest: true
      }
    }
  ]
}
