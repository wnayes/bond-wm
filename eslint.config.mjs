import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  { ignores: ["**/dist/"] },
  ...tseslint.config({
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "react-hooks": eslintPluginReactHooks,
    },
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended, eslintPluginPrettierRecommended],
    rules: {
      "no-prototype-builtins": 0,
      "@typescript-eslint/ban-types": 0,
      "@typescript-eslint/no-non-null-assertion": 0,
      "@typescript-eslint/no-require-imports": 0,

      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  }),
];
