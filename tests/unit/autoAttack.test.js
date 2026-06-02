import { describe, expect, it } from "vitest";
import { planVolley } from "../../src/systems/autoAttack.js";

const basePlayer = {
  x: 0, y: 0, attackRange: 300, attackInterval: 500, projectilesPerVolley: 1,
};

describe("planVolley", () => {
  it("returns null when cooldown not elapsed", () => {
    const r = planVolley({ tMs: 100, lastShotMs: 0, player: basePlayer, enemies: [{ x: 50, y: 0 }] });
    expect(r).toBeNull();
  });
  it("returns null when no enemies in range", () => {
    const r = planVolley({ tMs: 1000, lastShotMs: 0, player: basePlayer, enemies: [{ x: 1000, y: 0 }] });
    expect(r).toBeNull();
  });
  it("picks nearest enemy", () => {
    const e1 = { x: 200, y: 0, id: "far" };
    const e2 = { x: 50, y: 0, id: "near" };
    const r = planVolley({ tMs: 1000, lastShotMs: 0, player: basePlayer, enemies: [e1, e2] });
    expect(r.targets[0]).toBe(e2);
  });
  it("returns up to projectilesPerVolley targets", () => {
    const player = { ...basePlayer, projectilesPerVolley: 2 };
    const enemies = [{ x: 30, y: 0 }, { x: 60, y: 0 }, { x: 90, y: 0 }];
    const r = planVolley({ tMs: 1000, lastShotMs: 0, player, enemies });
    expect(r.targets.length).toBe(2);
  });
  it("updates nextLastShotMs to tMs", () => {
    const r = planVolley({ tMs: 1234, lastShotMs: 0, player: basePlayer, enemies: [{ x: 50, y: 0 }] });
    expect(r.nextLastShotMs).toBe(1234);
  });
});
