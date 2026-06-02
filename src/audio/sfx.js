/**
 * Short SFX sequences played via SynthEngine.playSequence.
 */

export const SFX = {
  hit: [
    { note: "E5", dur: 40, type: "square", gain: 0.32 },
    { note: "A4", dur: 60, type: "square", gain: 0.25 },
  ],
  gem: [
    { note: "E6", dur: 60, type: "triangle", gain: 0.28 },
    { note: "B6", dur: 80, type: "triangle", gain: 0.24 },
  ],
  levelUp: [
    { note: "C5", dur: 90, type: "triangle", gain: 0.30 },
    { note: "E5", dur: 90, type: "triangle", gain: 0.30 },
    { note: "G5", dur: 90, type: "triangle", gain: 0.30 },
    { note: "C6", dur: 180, type: "triangle", gain: 0.32 },
  ],
  playerHit: [
    { note: "G3", dur: 80, type: "sawtooth", gain: 0.35 },
    { note: "D3", dur: 120, type: "sawtooth", gain: 0.28 },
  ],
  death: [
    { note: "E4", dur: 140, type: "sawtooth", gain: 0.35 },
    { note: "D4", dur: 140, type: "sawtooth", gain: 0.32 },
    { note: "C4", dur: 200, type: "sawtooth", gain: 0.30 },
    { note: "G3", dur: 320, type: "sawtooth", gain: 0.28 },
  ],
  uiHover: [
    { note: "D5", dur: 30, type: "square", gain: 0.16 },
  ],
  uiSelect: [
    { note: "G5", dur: 50, type: "square", gain: 0.22 },
    { note: "C6", dur: 70, type: "square", gain: 0.22 },
  ],
  bossWarn: [
    { note: "F2", dur: 200, type: "sawtooth", gain: 0.3 },
    { note: "F2", dur: 200, type: "sawtooth", gain: 0.3 },
    { note: "Bb2", dur: 240, type: "sawtooth", gain: 0.32 },
  ],
};
