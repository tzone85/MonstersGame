export const GAME_VERSION = "1.0.0";

export const RESOLUTION = { width: 1280, height: 720 };

export const PALETTE = {
  navyDeep: 0x0a1230,
  navy: 0x132160,
  goldWarm: 0xe7c66a,
  goldBright: 0xfde29a,
  parchment: 0xf0e2bc,
  parchmentDim: 0xc8b890,
  blood: 0xb83c3c,
  hpGreen: 0x4ac76a,
  xpBlue: 0x55a8ff,
  textHi: 0xffffff,
  textLo: 0xa9b0c8,
  shadow: 0x000000,
};

export const PALETTE_HEX = Object.fromEntries(
  Object.entries(PALETTE).map(([k, v]) => [k, `#${v.toString(16).padStart(6, "0")}`]),
);

export const STORAGE_KEY = "monstersgame.save.v1";
