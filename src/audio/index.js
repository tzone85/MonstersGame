import { SynthEngine } from "./SynthEngine.js";
import { SFX } from "./sfx.js";
import { TITLE_TRACK, DUNGEON_TRACK, BOSS_TRACK } from "./tracks.js";

let _engine = null;

export function getAudio() {
  if (!_engine) _engine = new SynthEngine();
  return _engine;
}

export function playSfx(name) {
  const e = getAudio();
  const seq = SFX[name];
  if (!seq) return;
  e.playSequence(seq);
}

export const TRACKS = {
  title:   TITLE_TRACK,
  dungeon: DUNGEON_TRACK,
  boss:    BOSS_TRACK,
};

export function playTrack(name) {
  const e = getAudio();
  const t = TRACKS[name];
  if (!t) return;
  e.playTrack(t);
}

export function stopTrack() {
  getAudio().stopTrack();
}

export function applyVolumesFromSave(save) {
  const e = getAudio();
  e.setVolume("master", save.settings.masterVolume);
  e.setVolume("bgm", save.settings.bgmVolume);
  e.setVolume("sfx", save.settings.sfxVolume);
}
