/**
 * Game balance tables: XP curve, wave schedule, passives, shop costs.
 * Pure data + pure helpers — safe to import from tests and from systems.
 */

/**
 * XP required to reach `nextLevel` from the level below it.
 * Smooth curve: 8 at level 1, ~24 at level 5, ~108 at level 15.
 * Tuned so a typical 10-minute run reaches level 12–15.
 */
export function xpForLevel(nextLevel) {
  if (nextLevel <= 1) return 0;
  const n = nextLevel - 1;
  return Math.round(6 + Math.pow(n, 1.6) * 3);
}

/**
 * Cumulative XP needed to reach `level` from level 1.
 */
export function totalXpForLevel(level) {
  let total = 0;
  for (let n = 2; n <= level; n++) total += xpForLevel(n);
  return total;
}

/**
 * Wave schedule: returns `{ kind, count, interval }` for the wave active at
 * time `tMs` since run start. Difficulty escalates every 30s.
 */
export const WAVE_SCHEDULE = [
  { fromMs: 0,       enemies: ["toad"],                 spawnEveryMs: 1400, batch: 1 },
  { fromMs: 30_000,  enemies: ["toad", "larva"],        spawnEveryMs: 1100, batch: 2 },
  { fromMs: 60_000,  enemies: ["toad", "larva"],        spawnEveryMs: 900,  batch: 2 },
  { fromMs: 120_000, enemies: ["toad", "larva", "egg"], spawnEveryMs: 800,  batch: 3 },
  { fromMs: 180_000, enemies: ["larva", "egg"],         spawnEveryMs: 700,  batch: 3 },
  { fromMs: 240_000, enemies: ["toad", "larva", "egg"], spawnEveryMs: 600,  batch: 4 },
  { fromMs: 300_000, enemies: ["boss"],                 spawnEveryMs: 1, batch: 1, oneShot: true },
  { fromMs: 305_000, enemies: ["toad", "larva", "egg"], spawnEveryMs: 500,  batch: 4 },
  { fromMs: 480_000, enemies: ["toad", "larva", "egg"], spawnEveryMs: 350,  batch: 5 },
  { fromMs: 600_000, enemies: ["boss"],                 spawnEveryMs: 1, batch: 1, oneShot: true, final: true },
];

/**
 * Enemy archetypes — pure data.
 */
export const ENEMY_DEFS = {
  toad:  { hp: 6,   speed: 70,  damage: 8,  radius: 22, xp: 1, gold: 1, sheet: "toads",     frameCount: 6,  scale: 0.55 },
  larva: { hp: 18,  speed: 45,  damage: 12, radius: 26, xp: 2, gold: 2, sheet: "larva",     frameCount: 4,  scale: 0.6  },
  egg:   { hp: 30,  speed: 30,  damage: 14, radius: 30, xp: 3, gold: 3, sheet: "egg",       frameCount: 3,  scale: 0.7, hatchesInto: "larva", hatchCount: 2 },
  boss:  { hp: 320, speed: 55,  damage: 26, radius: 60, xp: 25, gold: 40, sheet: "toads",   frameCount: 6,  scale: 1.4, boss: true },
};

/**
 * Passive upgrade pool. Each effect mutates player stats additively or
 * multiplicatively at apply time.
 */
export const PASSIVES = [
  { id: "swiftness",   name: "Swiftness",   desc: "+15% move speed",          rarity: 3, apply: (p) => { p.moveSpeed *= 1.15; } },
  { id: "fury",        name: "Inner Fury",  desc: "+25% attack speed",        rarity: 3, apply: (p) => { p.attackInterval *= 0.8; } },
  { id: "power",       name: "Power",       desc: "+30% damage",              rarity: 3, apply: (p) => { p.attackDamage = Math.round(p.attackDamage * 1.3); } },
  { id: "vitality",    name: "Vitality",    desc: "+20 max HP, full heal",    rarity: 3, apply: (p) => { p.maxHp += 20; p.hp = p.maxHp; } },
  { id: "magnet",      name: "Lodestone",   desc: "+40% gem pickup radius",   rarity: 2, apply: (p) => { p.pickupRadius = Math.round(p.pickupRadius * 1.4); } },
  { id: "multishot",   name: "Twin Shot",   desc: "+1 projectile per volley", rarity: 1, apply: (p) => { p.projectilesPerVolley += 1; } },
  { id: "pierce",      name: "Piercing",    desc: "Projectiles pierce +1",    rarity: 2, apply: (p) => { p.projectilePierce += 1; } },
  { id: "range",       name: "Far Sight",   desc: "+25% attack range",        rarity: 2, apply: (p) => { p.attackRange *= 1.25; } },
  { id: "regen",       name: "Regeneration", desc: "+1 HP every 4s",          rarity: 1, apply: (p) => { p.regenPerSecond += 0.25; } },
  { id: "luck",        name: "Lucky Coin",  desc: "+30% gold from kills",     rarity: 1, apply: (p) => { p.goldMultiplier *= 1.3; } },
];

/**
 * Hero definitions for the Shop. v1 ships with one (bull) unlocked by
 * default; more are sketched so the unlock tree is meaningful.
 */
export const HEROES = [
  { id: "bull",   name: "Bullhorn",  desc: "Balanced. Auto-aims fireballs.",   cost: 0,    sheet: "bull" },
  { id: "boar",   name: "Boar Hunter", desc: "Higher HP, slower attack.",      cost: 500,  sheet: "bull", mods: (p) => { p.maxHp += 40; p.hp = p.maxHp; p.attackInterval *= 1.25; } },
  { id: "shade",  name: "Shadeling", desc: "Less HP, faster attack and move.", cost: 1200, sheet: "bull", mods: (p) => { p.maxHp -= 20; p.hp = p.maxHp; p.attackInterval *= 0.75; p.moveSpeed *= 1.2; } },
];

export const STARTING_PASSIVES = [
  { id: "start-magnet",  passiveId: "magnet",  name: "Start: Lodestone", cost: 300 },
  { id: "start-power",   passiveId: "power",   name: "Start: Power",     cost: 450 },
  { id: "start-vitality",passiveId: "vitality",name: "Start: Vitality",  cost: 450 },
];

export const PERKS = [
  { id: "perk-gold10",  name: "Coin Purse",   desc: "+10% gold from all runs.", cost: 250 },
  { id: "perk-revive",  name: "Phoenix Down", desc: "Auto-revive once per run.", cost: 800 },
];

export const PLAYER_DEFAULTS = Object.freeze({
  maxHp: 100,
  hp: 100,
  moveSpeed: 220,
  attackInterval: 700,
  attackRange: 360,
  attackDamage: 12,
  projectileSpeed: 520,
  projectilesPerVolley: 1,
  projectilePierce: 0,
  pickupRadius: 90,
  regenPerSecond: 0,
  goldMultiplier: 1,
});

export const RUN_LENGTH_MS = 10 * 60 * 1000;
