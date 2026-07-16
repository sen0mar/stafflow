const js = require("@eslint/js");
const { defineConfig, globalIgnores } = require("eslint/config");
const tseslint = require("typescript-eslint");

const vitestGlobals = {
  afterAll: "readonly",
  afterEach: "readonly",
  beforeAll: "readonly",
  beforeEach: "readonly",
  describe: "readonly",
  expect: "readonly",
  it: "readonly",
  vi: "readonly",
};

module.exports = defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.ts"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      globals: vitestGlobals,
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "test/*.ts",
            "test/integration/*.ts",
            "vitest.config.mts",
          ],
          maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 9,
        },
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
]);
