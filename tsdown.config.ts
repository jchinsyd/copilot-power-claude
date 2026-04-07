import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/main.ts",
  outDir: "./dist",
  format: "esm",
  dts: false,
  splitting: false,
  treeshaking: true,
  minify: true,
});
