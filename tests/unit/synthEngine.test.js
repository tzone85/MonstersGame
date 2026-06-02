import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { noteToHz, SynthEngine } from "../../src/audio/SynthEngine.js";

describe("noteToHz", () => {
  it("maps A4 to 440 Hz", () => { expect(noteToHz("A4")).toBeCloseTo(440, 5); });
  it("maps C4 to ~261.63 Hz", () => { expect(noteToHz("C4")).toBeCloseTo(261.625, 1); });
  it("passes through numbers", () => { expect(noteToHz(123.45)).toBe(123.45); });
  it("unknown note falls back to 440", () => { expect(noteToHz("Q9")).toBe(440); });
});

/**
 * Minimal AudioContext mock that returns spy-able gain/oscillator/filter
 * nodes. Enough surface to exercise the scheduler.
 */
function mockNode() {
  return {
    connect: vi.fn(), disconnect: vi.fn(),
    gain: { value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    frequency: { value: 0 },
    Q: { value: 0 },
    type: "",
    start: vi.fn(), stop: vi.fn(),
  };
}
function installMockAudioContext() {
  globalThis.window = globalThis.window ?? {};
  let now = 0;
  window.AudioContext = class {
    constructor() {
      this.currentTime = now;
      this.state = "suspended";
      this.destination = { kind: "destination" };
    }
    createGain()    { return mockNode(); }
    createOscillator() { return mockNode(); }
    createBiquadFilter() { return mockNode(); }
    resume()        { this.state = "running"; return Promise.resolve(); }
  };
  return () => { delete window.AudioContext; };
}

describe("SynthEngine (no AudioContext)", () => {
  it("constructs without window AudioContext", () => {
    const e = new SynthEngine();
    expect(e.ctx).toBeNull();
  });
  it("setVolume tolerates missing context", () => {
    const e = new SynthEngine();
    expect(() => e.setVolume("master", 0.5)).not.toThrow();
    expect(e.volumes.master).toBe(0.5);
  });
  it("clamps volume to [0,1]", () => {
    const e = new SynthEngine();
    e.setVolume("bgm", 2);
    expect(e.volumes.bgm).toBe(1);
    e.setVolume("bgm", -1);
    expect(e.volumes.bgm).toBe(0);
  });
  it("setMuted tolerates missing context", () => {
    const e = new SynthEngine();
    expect(() => e.setMuted(true)).not.toThrow();
  });
});

describe("SynthEngine (mocked AudioContext)", () => {
  let restore;
  beforeEach(() => { restore = installMockAudioContext(); });
  afterEach(() => restore());

  it("resume() instantiates context and resumes", async () => {
    const e = new SynthEngine();
    await e.resume();
    expect(e.ctx).toBeDefined();
    expect(e.ctx.state).toBe("running");
  });

  it("setVolume updates bus gain", async () => {
    const e = new SynthEngine();
    await e.resume();
    e.setVolume("bgm", 0.3);
    expect(e.buses.bgm.gain.value).toBe(0.3);
  });

  it("setMuted zeros master gain then restores on unmute", async () => {
    const e = new SynthEngine();
    await e.resume();
    e.setMuted(true);
    expect(e.buses.master.gain.value).toBe(0);
    e.setMuted(false);
    expect(e.buses.master.gain.value).toBeCloseTo(e.volumes.master);
  });

  it("playNote schedules oscillator + envelope", async () => {
    const e = new SynthEngine();
    await e.resume();
    const { osc } = e.playNote({ freq: 440, durationMs: 200, type: "square" });
    expect(osc.start).toHaveBeenCalled();
    expect(osc.stop).toHaveBeenCalled();
  });

  it("playNote with filter routes through biquad", async () => {
    const e = new SynthEngine();
    await e.resume();
    const result = e.playNote({ freq: 440, durationMs: 200, filter: { type: "lowpass", freq: 800, q: 0.7 } });
    expect(result.node).toBeDefined();
  });

  it("playSequence schedules each step", async () => {
    const e = new SynthEngine();
    await e.resume();
    expect(() => e.playSequence([
      { note: "C4", dur: 100 },
      { note: "E4", dur: 100, gap: 20 },
    ])).not.toThrow();
  });

  it("playTrack scheduler runs without throwing and stops cleanly", async () => {
    vi.useFakeTimers();
    const e = new SynthEngine();
    await e.resume();
    e.playTrack({
      bpm: 120, subdivision: 4,
      pattern: [{ type: "square", gain: 0.1, sequence: [{ note: "C4" }, null, { note: "E4" }, null] }],
    });
    vi.advanceTimersByTime(500);
    e.stopTrack();
    expect(e._activeTrack).toBeNull();
    vi.useRealTimers();
  });
});
