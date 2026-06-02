import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["tests/unit/**/*.test.js"],
    exclude: ["tests/e2e/**", "node_modules/**", "dist/**"],
    coverage: {
      provider: "v8",
      include: [
        "src/systems/**/*.js",
        "src/save/**/*.js",
        "src/audio/SynthEngine.js",
        "src/config/balance.js",
      ],
      reporter: ["text", "html"],
      thresholds: { lines: 80, branches: 75, functions: 80, statements: 80 },
    },
  },
});
