import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next + chống quét nhầm build dir lạc trong src:
    ".next/**",
    "src/.next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Nới 2 rule cho pattern hiện tại của codebase (có chủ đích, không phải quên):
    // - no-explicit-any: BE trả dữ liệu snake_case/camelCase trộn nhau, FE dùng
    //   `(post as any)` để đọc tương thích 2 dạng. Sẽ xoá dần khi chuẩn hoá types.
    // - set-state-in-effect: các effect "đọc localStorage sau mount" (theme,
    //   auth boot, chatbot mounted-guard) là pattern chống hydration mismatch hợp lệ.
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
