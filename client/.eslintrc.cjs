/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  "root": true,
  "extends": [
    'eslint:recommended',
    "plugin:vue/vue3-recommended",
    'plugin:vitest-globals/recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    "prettier" // disables eslint formatting rules which could be enabled by 3rd party tools

  ],
  "ignorePatterns": [
    ".eslintrc.cjs",
    "dist",
    "coverage",
    "vite.config.ts"
  ],
  "parser": "vue-eslint-parser",
  "parserOptions": {
    parser: "@typescript-eslint/parser",
    sourceType: "module",
    ecmaVersion: 2022,
    project: ["tsconfig.vitest.json"],
    extraFileExtensions: [".vue"],
  },
  "env": {
    "vitest-globals/env": true,
    "node": true
  },
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unsafe-call": "warn",
    "@typescript-eslint/no-unsafe-member-access": "warn",
    "@typescript-eslint/no-unsafe-assignment": "warn",
    "@typescript-eslint/no-unsafe-member-access": "warn",
    "@typescript-eslint/no-unsafe-argument": "warn",
    "@typescript-eslint/no-unsafe-return": "warn",
    "vue/first-attribute-linebreak": "off"
  }
}
