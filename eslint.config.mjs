import eslintConfigNext from "eslint-config-next";

const config = [
  ...eslintConfigNext,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default config;
