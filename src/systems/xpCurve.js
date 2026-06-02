import { xpForLevel } from "../config/balance.js";

/**
 * Pure XP progression. Given current level and XP, returns whether a
 * level-up should fire and the updated state.
 *
 * Multiple level-ups in a single tick are handled in a loop so that a giant
 * gem (or a passive that grants 10 XP) cannot orphan the player one frame
 * below the level threshold.
 */
export function applyXpGain(state, gain) {
  let { level, xp } = state;
  let levelUps = 0;
  xp += gain;
  while (xp >= xpForLevel(level + 1)) {
    xp -= xpForLevel(level + 1);
    level += 1;
    levelUps += 1;
  }
  return { level, xp, levelUps };
}

/**
 * Progress (0..1) of the XP bar at the current level.
 */
export function xpBarRatio(level, xp) {
  const need = xpForLevel(level + 1);
  if (need <= 0) return 0;
  return Math.max(0, Math.min(1, xp / need));
}
