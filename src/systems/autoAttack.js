/**
 * Pure auto-attack planner: given the player state and the enemy positions,
 * decide whether to fire this tick and toward whom.
 *
 * Returns either `null` (no shot) or `{ targets, nextLastShotMs }`.
 *
 *   - targets: up to player.projectilesPerVolley enemy refs, sorted nearest
 *     first within attackRange.
 *
 * The caller is responsible for actually spawning Projectile entities.
 */
export function planVolley({ tMs, lastShotMs, player, enemies }) {
  if (tMs - lastShotMs < player.attackInterval) return null;
  if (enemies.length === 0) return null;
  const r2 = player.attackRange * player.attackRange;
  const candidates = [];
  for (const e of enemies) {
    const dx = e.x - player.x;
    const dy = e.y - player.y;
    const d2 = dx * dx + dy * dy;
    if (d2 <= r2) candidates.push({ enemy: e, d2 });
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.d2 - b.d2);
  const targets = candidates.slice(0, player.projectilesPerVolley).map((c) => c.enemy);
  return { targets, nextLastShotMs: tMs };
}
