import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from "globals";

// import eslintConfigPrettier from "eslint-config-prettier";
// import pluginVue from 'eslint-plugin-vue'

export default tseslint.config(
  {
    ignores: [
      "dist/",
      "coverage/",
    ]
  },
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
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
    rules: {
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
    }
  },
  {
    files: ["tests/**/*.spec.js"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
    }
  }
  // pluginVue.configs['flat/recommended'],
);