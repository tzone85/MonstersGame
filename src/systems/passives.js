import { PASSIVES } from "../config/balance.js";

const BY_ID = new Map(PASSIVES.map((p) => [p.id, p]));

export function getPassive(id) {
  return BY_ID.get(id) ?? null;
}

/**
 * Pick `n` distinct passives weighted by rarity, using the provided RNG.
 * `excludeIds` filters out single-take passives the player already owns.
 *
 * Higher rarity number = more common. Single-take passives (radius +40%,
 * full heal, etc.) become unavailable once owned; stackable passives like
 * "swiftness" can appear repeatedly.
 */
export const SINGLE_TAKE = new Set(["magnet", "vitality", "multishot", "pierce"]);

export function pickPassiveChoices(n, { excludeIds = [], rng = Math.random } = {}) {
  const pool = PASSIVES.filter((p) => !excludeIds.includes(p.id) || !SINGLE_TAKE.has(p.id));
  const choices = [];
  const remaining = [...pool];
  for (let k = 0; k < n && remaining.length > 0; k++) {
    const totalWeight = remaining.reduce((s, p) => s + p.rarity, 0);
    let roll = rng() * totalWeight;
    let idx = 0;
    for (; idx < remaining.length; idx++) {
      roll -= remaining[idx].rarity;
      if (roll <= 0) break;
    }
    const pick = remaining[Math.min(idx, remaining.length - 1)];
    choices.push(pick);
    remaining.splice(remaining.indexOf(pick), 1);
  }
  return choices;
}

/**
 * Apply a passive to the player state. Mutates `player` per the passive
 * definition. Returns the mutated player for convenience.
 */
export function applyPassive(player, passiveId) {
  const p = getPassive(passiveId);
  if (!p) return player;
  p.apply(player);
  player.takenPassives = player.takenPassives || [];
  player.takenPassives.push(passiveId);
  return player;
}
