import { describe, expect, it } from "vitest";
import { Game } from "../../src/game/game.js";

// Seeded RNG so init() is deterministic in tests.
function seededRng(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

describe("Game", () => {
  it("defaults to 1280x720 + 4 obstacles + 260 topMargin", () => {
    const g = new Game({ rng: seededRng(1) });
    expect(g.width).toBe(1280);
    expect(g.height).toBe(720);
    expect(g.numberOfObstacles).toBe(4);
    expect(g.topMargin).toBe(260);
  });

  it("init() places up to numberOfObstacles obstacles", () => {
    const g = new Game({ rng: seededRng(42) });
    const placed = g.init();
    expect(placed).toBeLessThanOrEqual(g.numberOfObstacles);
    expect(g.obstacles.length).toBe(placed);
  });

  it("init() respects topMargin (no obstacle's centre above it)", () => {
    const g = new Game({ rng: seededRng(7) });
    g.init();
    for (const o of g.obstacles) {
      expect(o.collisionY).toBeGreaterThan(g.topMargin);
    }
  });

  it("setMouse mutates the mouse state", () => {
    const g = new Game({ rng: seededRng(1) });
    g.setMouse({ x: 100, y: 200, pressed: true });
    expect(g.mouse).toMatchObject({ x: 100, y: 200, pressed: true });
  });

  it("step() advances the player one tick toward the mouse", () => {
    const g = new Game({ rng: seededRng(1) });
    g.init();
    const startX = g.player.collisionX;
    g.setMouse({ x: g.width - 1, y: g.player.collisionY });
    g.step();
    expect(g.player.collisionX).toBeGreaterThan(startX);
  });

  it("step() does not move the player when mouse is on top of it", () => {
    const g = new Game({ rng: seededRng(1) });
    g.init();
    g.setMouse({ x: g.player.collisionX, y: g.player.collisionY });
    const before = { x: g.player.collisionX, y: g.player.collisionY };
    g.step();
    expect(g.player.collisionX).toBe(before.x);
    expect(g.player.collisionY).toBe(before.y);
  });
});
