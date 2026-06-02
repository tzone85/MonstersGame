import { describe, expect, it } from "vitest";
import { pickPassiveChoices, applyPassive, SINGLE_TAKE } from "../../src/systems/passives.js";
import { PASSIVES } from "../../src/config/balance.js";

function rng(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

describe("pickPassiveChoices", () => {
  it("returns the requested count", () => {
    expect(pickPassiveChoices(3, { rng: rng(1) }).length).toBe(3);
  });
  it("excludes single-take passives already owned", () => {
    const owned = ["magnet", "vitality"];
    const picks = pickPassiveChoices(3, { excludeIds: owned, rng: rng(1) });
    for (const p of picks) {
      if (SINGLE_TAKE.has(p.id)) expect(owned.includes(p.id)).toBe(false);
    }
  });
  it("never returns duplicates within a single call", () => {
    const picks = pickPassiveChoices(3, { rng: rng(42) });
    const ids = picks.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("applyPassive", () => {
  it("swiftness boosts move speed by 15%", () => {
    const p = { moveSpeed: 200, takenPassives: [] };
    applyPassive(p, "swiftness");
    expect(p.moveSpeed).toBeCloseTo(230, 5);
  });
  it("records the taken passive", () => {
    const p = { moveSpeed: 200, takenPassives: [] };
    applyPassive(p, "swiftness");
    expect(p.takenPassives).toEqual(["swiftness"]);
  });
  it("unknown id is a no-op", () => {
    const p = { moveSpeed: 200 };
    applyPassive(p, "nope");
    expect(p.moveSpeed).toBe(200);
  });
  it("every passive in the pool has a working apply()", () => {
    for (const passive of PASSIVES) {
      const base = {
        moveSpeed: 200, attackInterval: 700, attackDamage: 10,
        maxHp: 100, hp: 100, pickupRadius: 80,
        projectilesPerVolley: 1, projectilePierce: 0,
        attackRange: 300, regenPerSecond: 0, goldMultiplier: 1,
        takenPassives: [],
      };
      expect(() => passive.apply(base)).not.toThrow();
    }
  });
});
