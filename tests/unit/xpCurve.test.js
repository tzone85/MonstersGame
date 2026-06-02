import { describe, expect, it } from "vitest";
import { applyXpGain, xpBarRatio } from "../../src/systems/xpCurve.js";
import { xpForLevel } from "../../src/config/balance.js";

describe("xpForLevel", () => {
  it("level 1 requires 0 xp (already there)", () => {
    expect(xpForLevel(1)).toBe(0);
  });
  it("monotonically increasing", () => {
    for (let n = 2; n < 30; n++) {
      expect(xpForLevel(n + 1)).toBeGreaterThanOrEqual(xpForLevel(n));
    }
  });
});

describe("applyXpGain", () => {
  it("no level up when xp gain stays under threshold", () => {
    const r = applyXpGain({ level: 1, xp: 0 }, 1);
    expect(r.level).toBe(1);
    expect(r.xp).toBe(1);
    expect(r.levelUps).toBe(0);
  });
  it("single level up consumes exactly the threshold", () => {
    const threshold = xpForLevel(2);
    const r = applyXpGain({ level: 1, xp: 0 }, threshold);
    expect(r.level).toBe(2);
    expect(r.xp).toBe(0);
    expect(r.levelUps).toBe(1);
  });
  it("multi-level up on huge gem", () => {
    const r = applyXpGain({ level: 1, xp: 0 }, 10_000);
    expect(r.level).toBeGreaterThan(5);
    expect(r.levelUps).toBeGreaterThan(4);
  });
});

describe("xpBarRatio", () => {
  it("clamps to [0,1]", () => {
    expect(xpBarRatio(1, 0)).toBe(0);
    expect(xpBarRatio(1, xpForLevel(2))).toBe(1);
    expect(xpBarRatio(1, xpForLevel(2) * 2)).toBe(1);
  });
});
