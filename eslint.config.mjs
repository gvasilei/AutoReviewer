import path from "node:path"
import { fileURLToPath } from "node:url"

import js from "@eslint/js"
import { FlatCompat } from "@eslint/eslintrc"
import githubPlugin from "eslint-plugin-github"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default [
  githubPlugin.getFlatConfigs().recommended,
  ...compat.config({
    env: {
      node: true,
      es6: true,
      jest: true,
    },
    globals: {
      Atomics: "readonly",
      SharedArrayBuffer: "readonly",
    },
    ignorePatterns: [
      "dist/**",
      "lib/**",
      "node_modules/**",
      "coverage/**",
      "**/coverage/**",
      "eslint.config.mjs",
      "jest.config.js",
      "*.json",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      project: ["./.github/linters/tsconfig.json", "./tsconfig.json"],
    },
    plugins: ["jest", "@typescript-eslint"],
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/eslint-recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:jest/recommended",
    ],
    rules: {
      camelcase: "off",
      "eslint-comments/no-use": "off",
      "eslint-comments/no-unused-disable": "off",
      "i18n-text/no-en": "off",
      "import/no-namespace": "off",
      "no-console": "off",
      "no-unused-vars": "off",
      "prettier/prettier": "error",
      semi: "off",
      "@typescript-eslint/array-type": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/consistent-type-assertions": "error",
      "@typescript-eslint/explicit-member-accessibility": [
        "error",
        { accessibility: "no-public" },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-array-constructor": "error",
      "@typescript-eslint/no-empty-interface": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-extraneous-class": "error",
      "@typescript-eslint/no-for-in-array": "error",
      "@typescript-eslint/no-inferrable-types": "error",
      "@typescript-eslint/no-misused-new": "error",
      "@typescript-eslint/no-namespace": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-require-imports": "error",
      "@typescript-eslint/no-unnecessary-qualifier": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-useless-constructor": "error",
      "@typescript-eslint/no-var-requires": "error",
      "@typescript-eslint/prefer-for-of": "warn",
      "@typescript-eslint/prefer-function-type": "warn",
      "@typescript-eslint/prefer-includes": "error",
      "@typescript-eslint/prefer-string-starts-ends-with": "error",
      "@typescript-eslint/promise-function-async": "off",
      "@typescript-eslint/require-array-sort-compare": "error",
      "@typescript-eslint/restrict-plus-operands": "error",
      "@typescript-eslint/unbound-method": "error",
      "no-redeclare": "off",
      "github/array-foreach": "off",
      "github/filenames-match-regex": ["warn", "^[a-z]+([A-Z][a-z0-9]+)*$"],
    },
  }),
]
