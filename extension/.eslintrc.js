/* eslint-env node */

// All Mozilla specific rules and environments at:
// http://firefox-source-docs.mozilla.org/tools/lint/linters/eslint-plugin-mozilla.html

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
      files: ["ts/**/*.ts", "ts/**/*.tsx"],
      extends: ["plugin:mocha/recommended"],
      // the dotenv-webpack plugin exposes process.env.* based on the contents in .env.development or .env.production
      globals: { process: "readonly" },
      parser: "@typescript-eslint/parser",
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
      files: "test/functional/**/*.ts",
      extends: ["plugin:mocha/recommended"],
      parser: "@typescript-eslint/parser",
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
