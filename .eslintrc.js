/* eslint-env node */

// All Mozilla specific rules and environments at:
// http://firefox-source-docs.mozilla.org/tools/lint/linters/eslint-plugin-mozilla.html

const typescriptBaseConfig = {
  parser: "@typescript-eslint/parser",
  extends: [
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
  ],
};

module.exports = {
  env: {
    es6: true,
  },
  extends: [
    "eslint:recommended",
    // list of rules at: https://dxr.mozilla.org/mozilla-central/source/tools/lint/eslint/eslint-plugin-mozilla/lib/configs/recommended.js
    "plugin:mozilla/recommended",
    "plugin:prettier/recommended",
  ],
  overrides: [
    {
      files: "src/**",
      env: {
        browser: true,
        webextensions: true,
      },
    },
    {
      ...typescriptBaseConfig,
      files: ["ts/**/*.ts", "ts/**/*.tsx"],
      extends: ["plugin:mocha/recommended"],
      globals: {
        // the dotenv-webpack plugin exposes process.env.* based on the contents in .env.development or .env.production
        process: "readonly",
        // require is available
        require: "readonly",
      },
      parserOptions: {
        project: "./tsconfig.json",
      },
      plugins: ["mocha"],
      env: {
        browser: true,
        mocha: true,
        webextensions: true,
      },
    },
    {
      ...typescriptBaseConfig,
      files: "test/functional/**/*.ts",
      extends: ["plugin:mocha/recommended"],
      parserOptions: {
        project: "./test/functional/tsconfig.json",
      },
      plugins: ["mocha"],
      env: {
        browser: true,
        mocha: true,
        node: true,
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
    ecmaFeatures: {
      jsx: false,
      experimentalObjectRestSpread: true,
    },
  },
  plugins: ["json", "mozilla"],
  root: true,
  rules: {
    "mozilla/no-aArgs": "error",
    "mozilla/balanced-listeners": "error",
    "comma-dangle": ["error", "always-multiline"],
    eqeqeq: "error",
    indent: "off",
    "max-len": [
      "warn",
      {
        code: 100,
        ignoreComments: true,
        ignoreTrailingComments: true,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      },
    ],
    "consistent-return": ["error", { treatUndefinedAsUnspecified: true }],
    "no-console": "warn",
    "no-shadow": "error",
    "no-unused-vars": "error",
    "no-var": "error",
    "prefer-const": "error",
    "prefer-spread": "error",
    semi: ["error", "always"],
    "valid-jsdoc": "warn",
  },
};
