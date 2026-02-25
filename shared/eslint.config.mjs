import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    parserOptions: {
      project: './tsconfig.json',
      tsconfigRootDir: __dirname,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    }
  }
);
