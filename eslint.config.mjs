import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";
import js from "@eslint/js";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
  recommendedConfig: js.configs.recommended,
});

const config = [
  {
    ignores: [
      "**/dist",
      "**/node_modules",
      "**/.next",
      "**/out-tsc",
      "**/next-env.d.ts",
    ],
  },
  ...compat
    .config({
      extends: ["next/core-web-vitals", "next/typescript", "prettier"],
    })
    .map((config) => ({
      ...config,
      files: ["**/*.ts", "**/*.tsx", "**/*.cts", "**/*.mts"],
      rules: {
        ...config.rules,
      },
    })),
  ...compat
    .config({
      extends: ["next/core-web-vitals", "prettier"],
    })
    .map((config) => ({
      ...config,
      files: ["**/*.js", "**/*.jsx", "**/*.cjs", "**/*.mjs"],
      rules: {
        ...config.rules,
      },
    })),
];

export default config;
