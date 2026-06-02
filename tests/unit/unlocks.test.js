import { describe, expect, it } from "vitest";
import { isUnlocked, purchase } from "../../src/save/unlocks.js";
import { DEFAULT_SAVE } from "../../src/save/schema.js";

describe("isUnlocked", () => {
  it("default hero is unlocked", () => {
    expect(isUnlocked(DEFAULT_SAVE, "hero", "bull")).toBe(true);
  });
  it("non-default hero is locked", () => {
    expect(isUnlocked(DEFAULT_SAVE, "hero", "boar")).toBe(false);
  });
  it("no starting passives by default", () => {
    expect(isUnlocked(DEFAULT_SAVE, "startingPassive", "start-magnet")).toBe(false);
  });
  it("no perks by default", () => {
    expect(isUnlocked(DEFAULT_SAVE, "perk", "perk-revive")).toBe(false);
  });
  it("unknown kind returns false", () => {
    expect(isUnlocked(DEFAULT_SAVE, "garbage", "bull")).toBe(false);
  });
});

describe("purchase across kinds", () => {
  it("starting passive purchase succeeds with enough gold", () => {
    const rich = { ...DEFAULT_SAVE, gold: 1000 };
    const r = purchase(rich, "startingPassive", "start-magnet");
    expect(r.ok).toBe(true);
    expect(r.save.unlocks.startingPassives).toContain("start-magnet");
  });
  it("perk purchase succeeds with enough gold", () => {
    const rich = { ...DEFAULT_SAVE, gold: 1000 };
    const r = purchase(rich, "perk", "perk-gold10");
    expect(r.ok).toBe(true);
    expect(r.save.unlocks.perks).toContain("perk-gold10");
  });
  it("unknown kind returns ok=false", () => {
    const r = purchase(DEFAULT_SAVE, "ghost", "x");
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("unknown");
  });
});
