/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-recommended',
    'eslint:recommended',
    '@vue/eslint-config-typescript/recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier/skip-formatting',
    'plugin:vitest-globals/recommended'
  ],
  parser: "vue-eslint-parser",
  parserOptions: {
    ecmaVersion: 'latest',
    parser: {
      // Script parser for `<script lang="ts">`
      "ts": "@typescript-eslint/parser"
    }
  },
  "env": {
    "vitest-globals/env": true
  }
}
