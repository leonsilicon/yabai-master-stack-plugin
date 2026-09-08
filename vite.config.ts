import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: { "*": "vp check --fix" },
  pack: {
    entry: ["src/+.ts", "src/_ymsp.ts"],
    platform: "node",
    outputOptions: { sanitizeFileName: false },
    format: "esm",
    dts: { tsgo: true },
    sourcemap: true,
    clean: true,
  },
  test: { include: ["tests/**/*.test.ts"] },
  lint: { options: { typeAware: true, typeCheck: true } },
  fmt: {},
});
