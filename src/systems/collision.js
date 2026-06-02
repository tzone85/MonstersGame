/**
 * Pure 2D collision + geometry helpers used by Game, Player, Obstacle.
 * No DOM, no canvas — fully unit-testable.
 */

/**
 * Check whether two circles overlap.
 * @returns {{collision: boolean, distance: number, sumRadii: number, dx: number, dy: number}}
 */
export function checkCircleCollision(a, b) {
  const dx = a.collisionX - b.collisionX;
  const dy = a.collisionY - b.collisionY;
  const distance = Math.hypot(dx, dy);
  const sumRadii = a.collisionRadius + b.collisionRadius;
  return { collision: distance < sumRadii, distance, sumRadii, dx, dy };
}

/**
 * Map a mouse-relative angle (radians, atan2 output) to one of 8 sprite-frame
 * rows representing the 8 cardinal/diagonal directions the player can face.
 *
 * The original implementation had a bug: `angle > 274` instead of `> 2.74`,
 * which made the "up-right edge" sector unreachable.
 */
export function angleToFrameY(angle) {
  if (angle < -2.74 || angle > 2.74) return 6;
  if (angle < -1.96) return 7;
  if (angle < -1.17) return 0;
  if (angle < -0.39) return 1;
  if (angle < 0.39) return 2;
  if (angle < 1.17) return 3;
  if (angle < 1.96) return 4;
  return 5; // angle <= 2.74
}

/**
 * Given a vector (dx, dy) and a max speed, return the unit-velocity to move
 * toward the target. When the distance is below `minDistance`, return zero
 * (avoids jittering when the cursor is already on the player).
 */
export function velocityToward(dx, dy, minDistance = 2) {
  const distance = Math.hypot(dx, dy);
  if (distance <= minDistance) return { vx: 0, vy: 0, distance };
  return { vx: dx / distance, vy: dy / distance, distance };
}

/**
 * Resolve a player↔obstacle collision by pushing the player out along the
 * collision normal so the circles are exactly tangent (+1 pixel of slack).
 *
 * Returns the player's corrected position.
 */
export function resolveCollision(player, obstacle, collisionResult) {
  if (!collisionResult.collision) return { x: player.collisionX, y: player.collisionY };
  const { distance, sumRadii, dx, dy } = collisionResult;
  if (distance === 0) {
    // exactly overlapping — pick an arbitrary direction
    return {
      x: obstacle.collisionX + (sumRadii + 1),
      y: obstacle.collisionY,
    };
  }
  const ux = dx / distance;
  const uy = dy / distance;
  return {
    x: obstacle.collisionX + (sumRadii + 1) * ux,
    y: obstacle.collisionY + (sumRadii + 1) * uy,
  };
}

/**
 * Check whether candidate obstacle would overlap (with spacing buffer) any
 * already-placed obstacle. Used by the circle-packing init routine.
 */
export function overlapsAny(candidate, placed, distanceBuffer) {
  return placed.some((o) => {
    const dx = candidate.collisionX - o.collisionX;
    const dy = candidate.collisionY - o.collisionY;
    const distance = Math.hypot(dx, dy);
    return distance < candidate.collisionRadius + o.collisionRadius + distanceBuffer;
  });
}

/**
 * Whether a candidate obstacle stays inside the playable area (respects top
 * margin reserved for the HUD).
 */
export function withinPlayfield(candidate, { width, height, topMargin }) {
  const margin = candidate.collisionRadius * 2;
  return (
    candidate.spriteX > 0 &&
    candidate.spriteX < width - candidate.width &&
    candidate.collisionY > topMargin + margin &&
    candidate.collisionY < height - margin
  );
}
