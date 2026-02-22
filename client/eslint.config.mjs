import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from "globals";

import eslintConfigPrettier from "eslint-config-prettier";
import pluginVue from 'eslint-plugin-vue'

export default tseslint.config(
  {
    ignores: [
      "dist/",
      "coverage/",
    ]
  },
  {
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      eslintConfigPrettier
    ],
    languageOptions: {
      globals: {
        ...globals.browser
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      }
    }
  },
  {
    files: ["*.vue", "**/*.vue"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      pluginVue.configs['flat/recommended'],
      eslintConfigPrettier
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        parser: "@typescript-eslint/parser",
        extraFileExtensions: [".vue"],
      },

    }
  },
  {
    rules: {
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "vue/first-attribute-linebreak": "off",
    }
  },
  {
    files: ["tests/**/*.spec.js", "tests/**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/unbound-method": "off",
    }
  }
  // pluginVue.configs['flat/recommended'],
);