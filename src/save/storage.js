import { SAVE_SCHEMA, DEFAULT_SAVE } from "./schema.js";
import { STORAGE_KEY } from "../config/game.js";

/**
 * Storage adapter — pure dependency injection so tests can pass a fake.
 */
function defaultStorage() {
  if (typeof localStorage !== "undefined") return localStorage;
  const mem = new Map();
  return {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
  };
}

export function loadSave(storage = defaultStorage()) {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return cloneDefault();
  let parsed;
  try { parsed = JSON.parse(raw); }
  catch { return quarantineAndReset(storage, raw); }
  const result = SAVE_SCHEMA.safeParse(parsed);
  if (!result.success) return quarantineAndReset(storage, raw);
  return result.data;
}

export function saveSave(save, storage = defaultStorage()) {
  const result = SAVE_SCHEMA.safeParse(save);
  if (!result.success) throw new Error(`invalid save: ${result.error.message}`);
  storage.setItem(STORAGE_KEY, JSON.stringify(result.data));
}

export function resetSave(storage = defaultStorage()) {
  storage.removeItem(STORAGE_KEY);
  return cloneDefault();
}

/**
 * Apply a mutator to the current save, validate, persist. The mutator must
 * return the new save (treat input as immutable).
 */
export function updateSave(mutator, storage = defaultStorage()) {
  const current = loadSave(storage);
  const next = mutator({ ...current,
    settings: { ...current.settings },
    unlocks:  { ...current.unlocks, heroes: [...current.unlocks.heroes], startingPassives: [...current.unlocks.startingPassives], perks: [...current.unlocks.perks] },
    records:  { ...current.records },
  });
  saveSave(next, storage);
  return next;
}

function cloneDefault() {
  return JSON.parse(JSON.stringify(DEFAULT_SAVE));
}

function quarantineAndReset(storage, raw) {
  try {
    const ts = Date.now();
    storage.setItem(`${STORAGE_KEY}.invalid.${ts}`, String(raw));
  } catch { /* storage may be full or readonly; non-fatal */ }
  storage.removeItem(STORAGE_KEY);
  return cloneDefault();
}
