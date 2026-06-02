import { describe, expect, it } from "vitest";
import {
  angleToFrameY,
  checkCircleCollision,
  overlapsAny,
  resolveCollision,
  velocityToward,
  withinPlayfield,
} from "../../src/systems/collision.js";

describe("checkCircleCollision", () => {
  it("detects overlap", () => {
    const a = { collisionX: 0, collisionY: 0, collisionRadius: 5 };
    const b = { collisionX: 4, collisionY: 0, collisionRadius: 5 };
    const r = checkCircleCollision(a, b);
    expect(r.collision).toBe(true);
    expect(r.distance).toBe(4);
    expect(r.sumRadii).toBe(10);
  });

  it("returns no-collision when circles are apart", () => {
    const a = { collisionX: 0, collisionY: 0, collisionRadius: 5 };
    const b = { collisionX: 50, collisionY: 0, collisionRadius: 5 };
    expect(checkCircleCollision(a, b).collision).toBe(false);
  });

  it("edge case: exactly tangent does NOT count as collision (strict <)", () => {
    const a = { collisionX: 0, collisionY: 0, collisionRadius: 5 };
    const b = { collisionX: 10, collisionY: 0, collisionRadius: 5 };
    expect(checkCircleCollision(a, b).collision).toBe(false);
  });
});

describe("angleToFrameY (BUG REGRESSION: original used 274 not 2.74)", () => {
  it.each([
    [-3.14, 6],
    [-2.75, 6],
    [3.14, 6], // would have been wrong in the original
    [3.0, 6], // would have been wrong in the original
    [-2.5, 7],
    [-1.5, 0],
    [-0.78, 1],
    [0, 2],
    [0.78, 3],
    [1.5, 4],
    [2.5, 5],
  ])("angle %f → frame %i", (angle, expected) => {
    expect(angleToFrameY(angle)).toBe(expected);
  });
});

describe("velocityToward", () => {
  it("returns zero velocity within minDistance", () => {
    const v = velocityToward(1, 0, 2);
    expect(v.vx).toBe(0);
    expect(v.vy).toBe(0);
    expect(v.distance).toBe(1);
  });

  it("returns unit vector toward target outside minDistance", () => {
    const v = velocityToward(3, 4, 2);
    expect(v.distance).toBe(5);
    expect(v.vx).toBeCloseTo(0.6, 5);
    expect(v.vy).toBeCloseTo(0.8, 5);
  });

  it("handles exactly minDistance as zero", () => {
    const v = velocityToward(2, 0, 2);
    expect(v.vx).toBe(0);
  });
});

describe("resolveCollision", () => {
  it("pushes player out so circles are tangent + 1 px", () => {
    const player = { collisionX: 0, collisionY: 0 };
    const obstacle = { collisionX: 0, collisionY: 0 };
    const cr = { collision: true, distance: 2, sumRadii: 10, dx: 2, dy: 0 };
    const pos = resolveCollision(player, obstacle, cr);
    // distance 2 → unit_x = 1, unit_y = 0 → x = 0 + (10+1)*1 = 11
    expect(pos.x).toBe(11);
    expect(pos.y).toBe(0);
  });

  it("falls back to a deterministic shove when circles are exactly co-located", () => {
    const player = { collisionX: 0, collisionY: 0 };
    const obstacle = { collisionX: 0, collisionY: 0 };
    const cr = { collision: true, distance: 0, sumRadii: 10, dx: 0, dy: 0 };
    const pos = resolveCollision(player, obstacle, cr);
    expect(pos.x).toBe(11);
  });

  it("no-op when not colliding", () => {
    const player = { collisionX: 7, collisionY: 8 };
    const obstacle = { collisionX: 0, collisionY: 0 };
    const cr = { collision: false, distance: 100, sumRadii: 10, dx: 7, dy: 8 };
    const pos = resolveCollision(player, obstacle, cr);
    expect(pos).toEqual({ x: 7, y: 8 });
  });
});

describe("overlapsAny", () => {
  const placed = [{ collisionX: 0, collisionY: 0, collisionRadius: 30 }];
  it("true when within buffer", () => {
    const cand = { collisionX: 50, collisionY: 0, collisionRadius: 30 };
    expect(overlapsAny(cand, placed, 100)).toBe(true);
  });
  it("false when comfortably outside buffer", () => {
    const cand = { collisionX: 500, collisionY: 0, collisionRadius: 30 };
    expect(overlapsAny(cand, placed, 100)).toBe(false);
  });
  it("false when placed is empty", () => {
    expect(
      overlapsAny(
        { collisionX: 0, collisionY: 0, collisionRadius: 30 },
        [],
        100,
      ),
    ).toBe(false);
  });
});

describe("withinPlayfield", () => {
  const field = { width: 1280, height: 720, topMargin: 200 };

  it("true for an obstacle comfortably inside", () => {
    expect(
      withinPlayfield(
        {
          collisionX: 600,
          collisionY: 400,
          collisionRadius: 55,
          spriteX: 200,
          width: 250,
        },
        field,
      ),
    ).toBe(true);
  });

  it("false when above topMargin", () => {
    expect(
      withinPlayfield(
        {
          collisionX: 600,
          collisionY: 100,
          collisionRadius: 55,
          spriteX: 200,
          width: 250,
        },
        field,
      ),
    ).toBe(false);
  });

  it("false when off-screen horizontally", () => {
    expect(
      withinPlayfield(
        {
          collisionX: 600,
          collisionY: 400,
          collisionRadius: 55,
          spriteX: -10,
          width: 250,
        },
        field,
      ),
    ).toBe(false);
  });
});
