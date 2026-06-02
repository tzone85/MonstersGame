import { PALETTE } from "../config/game.js";

/**
 * FF-style dialog/UI frame drawn with Phaser Graphics — pixel-feel border,
 * navy fill, gold rule. No external 9-slice texture needed.
 */
export function drawFrame(scene, { x, y, width, height, alpha = 0.92 } = {}) {
  const g = scene.add.graphics({ x, y });
  // Outer gold rule
  g.lineStyle(2, PALETTE.goldBright, 1);
  g.fillStyle(PALETTE.navyDeep, alpha);
  g.fillRoundedRect(0, 0, width, height, 8);
  g.strokeRoundedRect(0, 0, width, height, 8);
  // Inner gold pinstripe
  g.lineStyle(1, PALETTE.goldWarm, 0.7);
  g.strokeRoundedRect(4, 4, width - 8, height - 8, 6);
  return g;
}

/**
 * Smaller helper for HUD bars: track + fill + border.
 */
export function drawBar(scene, { x, y, width, height, ratio, fillColor, trackColor = PALETTE.navy }) {
  const g = scene.add.graphics({ x, y });
  g.fillStyle(trackColor, 0.85);
  g.fillRoundedRect(0, 0, width, height, 4);
  g.fillStyle(fillColor, 1);
  g.fillRoundedRect(2, 2, Math.max(0, (width - 4) * ratio), height - 4, 3);
  g.lineStyle(1, PALETTE.goldWarm, 0.9);
  g.strokeRoundedRect(0, 0, width, height, 4);
  return g;
}
