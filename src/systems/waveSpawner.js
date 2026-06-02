import { WAVE_SCHEDULE } from "../config/balance.js";

/**
 * Find the wave config active at run time `tMs`.
 */
export function currentWave(tMs) {
  let last = WAVE_SCHEDULE[0];
  for (const w of WAVE_SCHEDULE) {
    if (tMs >= w.fromMs) last = w; else break;
  }
  return last;
}

/**
 * Pure spawn decision: given the previous tick's last-spawn time and current
 * time, decide how many enemies to spawn this tick and what kinds.
 *
 * Returns { spawns: [kind, ...], nextLastSpawnMs }.
 */
export function tickSpawns({ tMs, lastSpawnMs, rng = Math.random }) {
  const wave = currentWave(tMs);
  if (wave.oneShot) {
    // One-shot waves (boss waves) fire once when first crossed.
    if (lastSpawnMs < wave.fromMs) {
      return { spawns: Array.from({ length: wave.batch }, () => wave.enemies[0]), nextLastSpawnMs: tMs };
    }
    return { spawns: [], nextLastSpawnMs: lastSpawnMs };
  }
  if (tMs - lastSpawnMs < wave.spawnEveryMs) {
    return { spawns: [], nextLastSpawnMs: lastSpawnMs };
  }
  const spawns = [];
  for (let i = 0; i < wave.batch; i++) {
    const idx = Math.floor(rng() * wave.enemies.length);
    spawns.push(wave.enemies[idx]);
  }
  return { spawns, nextLastSpawnMs: tMs };
}

/**
 * For a given world size, pick a spawn point on a ring just outside the
 * camera (so enemies appear to walk onto the screen). Pure.
 */
export function spawnPointOnRing({ width, height, ringRadius = 460, rng = Math.random }) {
  const cx = width * 0.5;
  const cy = height * 0.5;
  const angle = rng() * Math.PI * 2;
  return {
    x: cx + Math.cos(angle) * ringRadius,
    y: cy + Math.sin(angle) * ringRadius,
  };
}
