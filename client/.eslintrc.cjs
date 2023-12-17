/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  "root": true,
  "extends": [
    'eslint:recommended',
    "plugin:vue/vue3-recommended",
    'plugin:vitest-globals/recommended',
    'plugin:@typescript-eslint/recommended',
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
    "ecmaVersion": 'latest',
    "parser": {
      // Script parser for `<script lang="ts">`
      "ts": "@typescript-eslint/parser",
    },
  },
  "env": {
    "vitest-globals/env": true,
    "node": true
  },
  "rules": {
    "vue/first-attribute-linebreak": "off"
  }
}
