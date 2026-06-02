/**
 * Hand-sequenced chiptune tracks for Title / Dungeon / Boss.
 * Each track is { bpm, subdivision, pattern: [voice...] }.
 *
 * Notation: `{ note: "C4", dur: ms?, gain?, type? }` or `null` for a rest.
 * `dur` defaults to one step.
 */

const n = (note, opts = {}) => ({ note, ...opts });

export const TITLE_TRACK = {
  bpm: 92,
  subdivision: 4,
  pattern: [
    // Lead — slow FF-overworld-ish arpeggio in D minor
    {
      type: "triangle",
      gain: 0.16,
      sequence: [
        n("D4"), null, n("F4"), null, n("A4"), null, n("D5"), null,
        n("C5"), null, n("A4"), null, n("F4"), null, n("D4"), null,
        n("D4"), null, n("F4"), null, n("A4"), null, n("D5"), null,
        n("E5"), null, n("D5"), null, n("A4"), null, n("F4"), null,
      ],
    },
    // Bass — root + fifth pulse
    {
      type: "sine",
      gain: 0.22,
      sequence: [
        n("D2"), null, null, null, n("A2"), null, null, null,
        n("D2"), null, null, null, n("A2"), null, null, null,
        n("F2"), null, null, null, n("C3"), null, null, null,
        n("G2"), null, null, null, n("A2"), null, null, null,
      ],
    },
  ],
};

export const DUNGEON_TRACK = {
  bpm: 138,
  subdivision: 4,
  pattern: [
    // Driving 8th-note bass
    {
      type: "square",
      gain: 0.14,
      sequence: [
        n("D3"), n("D3"), n("F3"), n("D3"), n("A3"), n("D3"), n("F3"), n("D3"),
        n("D3"), n("D3"), n("F3"), n("D3"), n("A3"), n("D3"), n("F3"), n("D3"),
        n("C3"), n("C3"), n("E3"), n("C3"), n("G3"), n("C3"), n("E3"), n("C3"),
        n("Bb2"),n("Bb2"),n("D3"), n("Bb2"),n("F3"), n("Bb2"),n("D3"), n("Bb2"),
      ],
    },
    // Lead melody
    {
      type: "triangle",
      gain: 0.12,
      sequence: [
        n("A4"), null, n("F4"), null, n("E4"), null, n("D4"), null,
        n("A4"), null, n("D5"), null, n("E5"), null, n("D5"), null,
        n("G4"), null, n("E4"), null, n("D4"), null, n("C4"), null,
        n("F4"), null, n("D4"), null, n("Bb3"),null, n("A3"), null,
      ],
    },
    // Hi-hat-ish noise via short square hits
    {
      type: "square",
      gain: 0.05,
      sequence: [
        null, n("E6", { dur: 40 }), null, n("E6", { dur: 40 }),
        null, n("E6", { dur: 40 }), null, n("E6", { dur: 40 }),
        null, n("E6", { dur: 40 }), null, n("E6", { dur: 40 }),
        null, n("E6", { dur: 40 }), null, n("E6", { dur: 40 }),
        null, n("E6", { dur: 40 }), null, n("E6", { dur: 40 }),
        null, n("E6", { dur: 40 }), null, n("E6", { dur: 40 }),
        null, n("E6", { dur: 40 }), null, n("E6", { dur: 40 }),
        null, n("E6", { dur: 40 }), null, n("E6", { dur: 40 }),
      ],
    },
  ],
};

export const BOSS_TRACK = {
  bpm: 156,
  subdivision: 4,
  pattern: [
    // Menacing low bass
    {
      type: "sawtooth",
      gain: 0.14,
      sequence: [
        n("D2"), n("D2"), n("D2"), n("D2"), n("F2"), n("F2"), n("F2"), n("F2"),
        n("Bb2"),n("Bb2"),n("Bb2"),n("Bb2"),n("A2"), n("A2"), n("A2"), n("A2"),
      ],
    },
    // Lead riff
    {
      type: "square",
      gain: 0.13,
      sequence: [
        n("A4"), n("Bb4"),n("A4"), n("F4"), n("D4"), n("F4"), n("A4"), n("D5"),
        n("C5"), n("A4"), n("F4"), n("D4"), n("E4"), n("F4"), n("A4"), n("Bb4"),
      ],
    },
  ],
};
