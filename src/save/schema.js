import { z } from "zod";

export const SETTINGS_SCHEMA = z.object({
  masterVolume: z.number().min(0).max(1).default(0.7),
  bgmVolume: z.number().min(0).max(1).default(0.55),
  sfxVolume: z.number().min(0).max(1).default(0.8),
  screenShake: z.enum(["off", "low", "high"]).default("low"),
  palette: z.enum(["default", "colorblind"]).default("default"),
  hasSeenTutorial: z.boolean().default(false),
});

export const UNLOCKS_SCHEMA = z.object({
  heroes: z.array(z.string()).default(["bull"]),
  startingPassives: z.array(z.string()).default([]),
  perks: z.array(z.string()).default([]),
});

export const RECORDS_SCHEMA = z.object({
  bestTimeMs: z.number().int().nonnegative().default(0),
  bestKills: z.number().int().nonnegative().default(0),
  totalRuns: z.number().int().nonnegative().default(0),
});

export const SAVE_SCHEMA = z.object({
  version: z.literal(1),
  gold: z.number().int().nonnegative().default(0),
  settings: SETTINGS_SCHEMA,
  unlocks: UNLOCKS_SCHEMA,
  records: RECORDS_SCHEMA,
  selectedHero: z.string().default("bull"),
});

export const DEFAULT_SAVE = Object.freeze({
  version: 1,
  gold: 0,
  selectedHero: "bull",
  settings: SETTINGS_SCHEMA.parse({}),
  unlocks: UNLOCKS_SCHEMA.parse({}),
  records: RECORDS_SCHEMA.parse({}),
});
