// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from "eslint-config-prettier";
import pluginVue from 'eslint-plugin-vue'

export default tseslint.config(
  {
    ignores: [
      "dist/",
      "coverage/",
      "vite.config.ts",
      "eslint.config.mjs"
    ]
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      'typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        project: ['tsconfig.vitest.json'],
        ecmaVersion: 2022,
        extraFileExtensions: ['.vue'],
        sourceType: 'module'
      }
    },
  },
  ...pluginVue.configs['flat/recommended'],
  eslintConfigPrettier,

);