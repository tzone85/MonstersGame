export { angleToFrameY } from "./collision.js";

/**
 * Pure steering: given a position and a target, returns a unit velocity
 * vector. Used by Player (clicks) and Enemy (chase).
 */
export function steerTo(from, to, deadZone = 1) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= deadZone) return { vx: 0, vy: 0, dist };
  return { vx: dx / dist, vy: dy / dist, dist };
}
