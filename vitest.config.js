import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["tests/unit/**/*.test.js"],
    exclude: ["tests/e2e/**", "node_modules/**", "dist/**"],
    coverage: {
      provider: "v8",
      include: ["src/game/**/*.js"],
      // Exclude DOM/canvas-bound code — the Player/Obstacle draw() methods
      // and Game.render() depend on a real CanvasRenderingContext2D. These
      // paths are exercised by the Playwright e2e smoke test instead.
      exclude: ["src/game/player.js", "src/game/obstacle.js"],
      reporter: ["text", "html"],
      thresholds: { lines: 85, branches: 80, functions: 85, statements: 85 },
    },
  },
});
