import { HEROES, STARTING_PASSIVES, PERKS } from "../config/balance.js";

export function isUnlocked(save, kind, id) {
  if (kind === "hero") return save.unlocks.heroes.includes(id);
  if (kind === "startingPassive") return save.unlocks.startingPassives.includes(id);
  if (kind === "perk") return save.unlocks.perks.includes(id);
  return false;
}

export function purchase(save, kind, id) {
  const def = lookup(kind, id);
  if (!def) return { save, ok: false, reason: "unknown" };
  if (isUnlocked(save, kind, id)) return { save, ok: false, reason: "already-owned" };
  if (save.gold < def.cost) return { save, ok: false, reason: "insufficient-gold" };
  const next = {
    ...save,
    gold: save.gold - def.cost,
    unlocks: {
      ...save.unlocks,
      heroes:           kind === "hero"             ? [...save.unlocks.heroes, id]           : save.unlocks.heroes,
      startingPassives: kind === "startingPassive"  ? [...save.unlocks.startingPassives, id] : save.unlocks.startingPassives,
      perks:            kind === "perk"             ? [...save.unlocks.perks, id]            : save.unlocks.perks,
    },
  };
  return { save: next, ok: true };
}

function lookup(kind, id) {
  if (kind === "hero")             return HEROES.find((h) => h.id === id);
  if (kind === "startingPassive")  return STARTING_PASSIVES.find((p) => p.id === id);
  if (kind === "perk")             return PERKS.find((p) => p.id === id);
  return null;
}
