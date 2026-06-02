import { describe, expect, it } from "vitest";
import { steerTo, angleToFrameY } from "../../src/systems/steering.js";

describe("steerTo", () => {
  it("returns zero velocity when inside deadZone", () => {
    const v = steerTo({ x: 0, y: 0 }, { x: 1, y: 0 }, 2);
    expect(v.vx).toBe(0);
    expect(v.vy).toBe(0);
  });
  it("returns a unit vector outside deadZone", () => {
    const v = steerTo({ x: 0, y: 0 }, { x: 3, y: 4 });
    expect(v.dist).toBe(5);
    expect(v.vx).toBeCloseTo(0.6, 5);
    expect(v.vy).toBeCloseTo(0.8, 5);
  });
});

describe("angleToFrameY re-export", () => {
  it("matches collision.angleToFrameY", () => {
    expect(angleToFrameY(0)).toBe(2);
    expect(angleToFrameY(Math.PI)).toBe(6);
  });
});
