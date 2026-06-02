import { describe, expect, it } from "vitest";
import { currentWave, tickSpawns, spawnPointOnRing } from "../../src/systems/waveSpawner.js";

function rng(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

describe("currentWave", () => {
  it("returns first wave at t=0", () => {
    expect(currentWave(0).fromMs).toBe(0);
  });
  it("advances at boundaries", () => {
    expect(currentWave(30_000).fromMs).toBe(30_000);
    expect(currentWave(60_000).fromMs).toBe(60_000);
  });
  it("first boss fires at 5:00", () => {
    expect(currentWave(300_000).oneShot).toBe(true);
  });
});

describe("tickSpawns", () => {
  it("does not spawn before interval elapses", () => {
    const r = tickSpawns({ tMs: 100, lastSpawnMs: 0, rng: rng(1) });
    expect(r.spawns).toEqual([]);
  });
  it("spawns batch after interval", () => {
    const r = tickSpawns({ tMs: 1500, lastSpawnMs: 0, rng: rng(1) });
    expect(r.spawns.length).toBeGreaterThan(0);
    expect(r.nextLastSpawnMs).toBe(1500);
  });
  it("boss wave is a one-shot batch", () => {
    const r = tickSpawns({ tMs: 300_000, lastSpawnMs: 200_000, rng: rng(1) });
    expect(r.spawns[0]).toBe("boss");
  });
  it("boss wave does not re-fire", () => {
    const r = tickSpawns({ tMs: 301_000, lastSpawnMs: 300_000, rng: rng(1) });
    expect(r.spawns).toEqual([]);
  });
});

describe("spawnPointOnRing", () => {
  it("returns a point at ring distance from centre", () => {
    const p = spawnPointOnRing({ width: 1000, height: 600, ringRadius: 400, rng: rng(7) });
    const d = Math.hypot(p.x - 500, p.y - 300);
    expect(d).toBeCloseTo(400, 0);
  });
});
