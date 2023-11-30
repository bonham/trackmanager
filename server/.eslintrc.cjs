module.exports = {
  "root": true,
  "env": {
    "node": true,
    "jest": true
  },
  "extends": [
    "eslint:recommended",
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    "prettier" // disables eslint formatting rules which could be enabled by 3rd party tools
  ],
  "plugins": [
    "@typescript-eslint",
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": [
      "./tsconfig-eslint.json"
    ],
    "tsconfigRootDir": __dirname
  },
  "ignorePatterns": [
    ".eslintrc.cjs",

  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unsafe-call": "warn",
    "@typescript-eslint/no-unsafe-member-access": "warn",
    "@typescript-eslint/no-unsafe-assignment": "warn",
    "@typescript-eslint/no-unsafe-member-access": "warn",
    "@typescript-eslint/no-unsafe-argument": "warn",
    "@typescript-eslint/no-unsafe-return": "warn",
    "@typescript-eslint/no-import-type-side-effects": "error", // related to verbatimModuleSyntax
    "@typescript-eslint/no-unnecessary-type-assertion": "warn",
  }
}

/*

{
  "root": true,
  "ignorePatterns": [
    "config.js",
    "jest.config.ts"
  ],
  "env": {
    "jest": true
  },
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "airbnb-base",
    "airbnb-typescript/base"
  ],
  "plugins": [
    "import",
    "@typescript-eslint"
  ],
  "rules": {
    "comma-dangle": 0,
    "no-underscore-dangle": 0,
    "no-param-reassign": 0,
    "no-return-assign": 0,
    "camelcase": 0,
    "import/extensions": 0,
    "@typescript-eslint/no-redeclare": 0,
    "linebreak-style": 0,
    "no-console": 0,
    "import/prefer-default-export": "off",
    "no-multiple-empty-lines": "off"
  },
  "settings": {
    "import/parsers": {
      "@typescript-eslint/parser": [
        ".ts",
        ".tsx"
      ]
    },
    "import/resolver": {
      "typescript": {}
    }
  }
}

*/