import { describe, expect, it, beforeEach } from "vitest";
import { loadSave, saveSave, updateSave, resetSave } from "../../src/save/storage.js";
import { SAVE_SCHEMA, DEFAULT_SAVE } from "../../src/save/schema.js";
import { purchase, isUnlocked } from "../../src/save/unlocks.js";
import { STORAGE_KEY } from "../../src/config/game.js";

function fakeStorage() {
  const data = new Map();
  return {
    _data: data,
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  };
}

let s;
beforeEach(() => { s = fakeStorage(); });

describe("schema", () => {
  it("default save passes validation", () => {
    expect(() => SAVE_SCHEMA.parse(DEFAULT_SAVE)).not.toThrow();
  });
});

describe("loadSave", () => {
  it("returns defaults when storage is empty", () => {
    const save = loadSave(s);
    expect(save.gold).toBe(0);
    expect(save.unlocks.heroes).toEqual(["bull"]);
  });

  it("loads valid saved data", () => {
    s.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULT_SAVE, gold: 500 }));
    const save = loadSave(s);
    expect(save.gold).toBe(500);
  });

  it("quarantines invalid JSON and resets", () => {
    s.setItem(STORAGE_KEY, "{not json");
    const save = loadSave(s);
    expect(save.gold).toBe(0);
    let foundQuarantine = false;
    for (const k of s._data.keys()) if (k.startsWith(`${STORAGE_KEY}.invalid.`)) foundQuarantine = true;
    expect(foundQuarantine).toBe(true);
  });

  it("quarantines schema-invalid data", () => {
    s.setItem(STORAGE_KEY, JSON.stringify({ version: 999 }));
    const save = loadSave(s);
    expect(save.version).toBe(1);
  });
});

describe("saveSave + updateSave", () => {
  it("persists changes round-trip", () => {
    const next = updateSave((cur) => ({ ...cur, gold: cur.gold + 100 }), s);
    expect(next.gold).toBe(100);
    const reload = loadSave(s);
    expect(reload.gold).toBe(100);
  });

  it("rejects invalid saves", () => {
    expect(() => saveSave({ version: 2 }, s)).toThrow();
  });
});

describe("resetSave", () => {
  it("clears storage and returns defaults", () => {
    s.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULT_SAVE, gold: 999 }));
    const fresh = resetSave(s);
    expect(fresh.gold).toBe(0);
    expect(s.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("purchase", () => {
  it("rejects when already owned", () => {
    const r = purchase(DEFAULT_SAVE, "hero", "bull");
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("already-owned");
  });
  it("rejects when insufficient gold", () => {
    const r = purchase(DEFAULT_SAVE, "hero", "boar");
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("insufficient-gold");
  });
  it("deducts gold and unlocks on success", () => {
    const rich = { ...DEFAULT_SAVE, gold: 1000 };
    const r = purchase(rich, "hero", "boar");
    expect(r.ok).toBe(true);
    expect(r.save.gold).toBe(500);
    expect(isUnlocked(r.save, "hero", "boar")).toBe(true);
  });
  it("returns false ok for unknown ids", () => {
    const r = purchase(DEFAULT_SAVE, "hero", "ghost");
    expect(r.ok).toBe(false);
  });
});
