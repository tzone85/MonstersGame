/**
 * Tiny WebAudio engine: per-channel gain buses, oscillator-based notes with
 * ADSR envelope + filter, and a sequencer for looping BGM tracks.
 *
 * Why hand-rolled (vs Tone.js): zero external dependency, total control over
 * the chiptune palette, and the API surface we actually need is small.
 */

const NOTE_FREQ = (() => {
  const A4 = 440;
  const names = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const map = {};
  for (let octave = 0; octave <= 8; octave++) {
    for (let i = 0; i < 12; i++) {
      const semitone = octave * 12 + i - 57; // A4 = 0
      map[`${names[i]}${octave}`] = A4 * Math.pow(2, semitone / 12);
    }
  }
  return map;
})();

export function noteToHz(note) {
  if (typeof note === "number") return note;
  return NOTE_FREQ[note] ?? 440;
}

export class SynthEngine {
  constructor({ volumes = { master: 0.7, bgm: 0.55, sfx: 0.8 } } = {}) {
    this.ctx = null;
    this.volumes = { ...volumes };
    this.buses = null;
    this._activeTrack = null;
    this._trackHandles = [];
    this._muted = false;
  }

  _ensure() {
    if (this.ctx) return;
    const AC = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return;
    this.ctx = new AC();
    this.buses = {
      master: this.ctx.createGain(),
      bgm:    this.ctx.createGain(),
      sfx:    this.ctx.createGain(),
    };
    this.buses.master.gain.value = this.volumes.master;
    this.buses.bgm.gain.value    = this.volumes.bgm;
    this.buses.sfx.gain.value    = this.volumes.sfx;
    this.buses.bgm.connect(this.buses.master);
    this.buses.sfx.connect(this.buses.master);
    this.buses.master.connect(this.ctx.destination);
  }

  /** Must be called from a user-gesture handler in Chrome/Safari. */
  resume() {
    this._ensure();
    if (this.ctx?.state === "suspended") return this.ctx.resume();
    return Promise.resolve();
  }

  setVolume(bus, value) {
    this._ensure();
    const v = Math.max(0, Math.min(1, value));
    this.volumes[bus] = v;
    if (this.buses?.[bus]) this.buses[bus].gain.value = this._muted && bus === "master" ? 0 : v;
  }

  setMuted(muted) {
    this._muted = !!muted;
    this._ensure();
    if (this.buses) this.buses.master.gain.value = muted ? 0 : this.volumes.master;
  }

  /**
   * Play a one-shot note with an ADSR envelope and optional low-pass filter.
   */
  playNote({ freq, durationMs, type = "square", bus = "sfx", attack = 0.005, decay = 0.05, sustain = 0.6, release = 0.05, gain = 0.4, filter = null }) {
    this._ensure();
    if (!this.ctx || !this.buses) return;
    const t0 = this.ctx.currentTime;
    const t1 = t0 + durationMs / 1000;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.linearRampToValueAtTime(gain * sustain, t0 + attack + decay);
    g.gain.setValueAtTime(gain * sustain, t1);
    g.gain.linearRampToValueAtTime(0, t1 + release);
    let node = osc;
    if (filter) {
      const flt = this.ctx.createBiquadFilter();
      flt.type = filter.type ?? "lowpass";
      flt.frequency.value = filter.freq ?? 1500;
      flt.Q.value = filter.q ?? 0.7;
      osc.connect(flt); flt.connect(g);
      node = flt;
    } else {
      osc.connect(g);
    }
    g.connect(this.buses[bus] ?? this.buses.sfx);
    osc.start(t0);
    osc.stop(t1 + release + 0.05);
    return { osc, g, node };
  }

  /**
   * Schedule a tiny SFX sequence: array of { note, dur, type?, gain?, delay? }.
   */
  playSequence(seq, { bus = "sfx", type = "square", baseGain = 0.35 } = {}) {
    this._ensure();
    if (!this.ctx) return;
    let offset = 0;
    const tNow = this.ctx.currentTime;
    for (const step of seq) {
      const freq = noteToHz(step.note);
      const start = tNow + offset + (step.delay ?? 0) / 1000;
      const dur = step.dur / 1000;
      const osc = this.ctx.createOscillator();
      osc.type = step.type ?? type;
      osc.frequency.value = freq;
      const g = this.ctx.createGain();
      const peak = (step.gain ?? baseGain);
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(peak, start + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0005, start + dur);
      osc.connect(g);
      g.connect(this.buses[bus]);
      osc.start(start);
      osc.stop(start + dur + 0.02);
      offset += (step.dur + (step.gap ?? 0)) / 1000;
    }
  }

  /**
   * Start a looping track. `track` is { bpm, pattern: [voice...] } where
   * each voice is { type, gain, sequence: [note|null x stepCount] }.
   *
   * The sequencer schedules `bars` bars ahead and re-fills as time passes.
   */
  playTrack(track, { bars = 2 } = {}) {
    this.stopTrack();
    this._ensure();
    if (!this.ctx) return;
    this._activeTrack = track;
    const stepDur = 60 / track.bpm / (track.subdivision ?? 4); // seconds per step
    let scheduledUntil = this.ctx.currentTime + 0.05;
    const scheduleAhead = () => {
      if (this._activeTrack !== track) return;
      const stepsPerBar = track.pattern[0].sequence.length;
      const horizon = this.ctx.currentTime + bars * stepsPerBar * stepDur;
      while (scheduledUntil < horizon) {
        for (const voice of track.pattern) {
          const idx = Math.floor(((scheduledUntil - this.ctx.currentTime) / stepDur));
          for (let s = 0; s < stepsPerBar; s++) {
            const stepStart = scheduledUntil + s * stepDur;
            const noteSpec = voice.sequence[(idx + s) % voice.sequence.length];
            if (!noteSpec) continue;
            const { note, dur = stepDur * 0.9, gain = voice.gain ?? 0.18, type = voice.type ?? "square" } = noteSpec;
            const freq = noteToHz(note);
            const osc = this.ctx.createOscillator();
            osc.type = type;
            osc.frequency.value = freq;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0, stepStart);
            g.gain.linearRampToValueAtTime(gain, stepStart + 0.005);
            g.gain.exponentialRampToValueAtTime(0.0005, stepStart + dur);
            osc.connect(g);
            g.connect(this.buses.bgm);
            osc.start(stepStart);
            osc.stop(stepStart + dur + 0.02);
            this._trackHandles.push(osc);
          }
        }
        scheduledUntil += stepsPerBar * stepDur;
      }
      this._trackTimer = setTimeout(scheduleAhead, 200);
    };
    scheduleAhead();
  }

  stopTrack() {
    if (this._trackTimer) clearTimeout(this._trackTimer);
    this._trackTimer = null;
    this._activeTrack = null;
    // Stop any still-pending oscillators by closing them quickly.
    for (const o of this._trackHandles) {
      try { o.stop(); } catch { /* already stopped */ }
    }
    this._trackHandles = [];
  }
}
