import Phaser from "phaser";
import { drawFrame } from "../ui/FFFrame.js";
import { makeButton } from "../ui/Button.js";
import { PALETTE, PALETTE_HEX } from "../config/game.js";
import { updateSave } from "../save/storage.js";
import { applyVolumesFromSave } from "../audio/index.js";

export default class SettingsScene extends Phaser.Scene {
  constructor() { super("Settings"); }

  init(data) { this.from = data?.from ?? "Title"; }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);
    drawFrame(this, { x: width / 2 - 320, y: 80, width: 640, height: 520 });
    this.add.text(width / 2, 112, "Settings", { fontFamily: "monospace", fontSize: "28px", color: PALETTE_HEX.goldBright }).setOrigin(0.5);

    const save = this.registry.get("save");
    const startY = 180;
    const row = 80;
    this._slider("Master Volume", "masterVolume", width / 2 - 200, startY,         save.settings.masterVolume);
    this._slider("BGM Volume",    "bgmVolume",    width / 2 - 200, startY + row,   save.settings.bgmVolume);
    this._slider("SFX Volume",    "sfxVolume",    width / 2 - 200, startY + row*2, save.settings.sfxVolume);

    this._cycler("Screen Shake", "screenShake", ["off", "low", "high"], save.settings.screenShake, width / 2 - 200, startY + row * 3);
    this._cycler("Palette",      "palette",     ["default", "colorblind"], save.settings.palette, width / 2 - 200, startY + row * 3 + 56);

    makeButton(this, { x: width / 2, y: 560, label: "← Back", onClick: () => this._close() });
    this.input.keyboard.on("keydown-ESC", () => this._close());
  }

  _slider(label, key, x, y, value) {
    this.add.text(x, y, label, { fontFamily: "monospace", fontSize: "16px", color: PALETTE_HEX.parchment });
    const track = this.add.rectangle(x + 200, y + 8, 240, 8, PALETTE.navy, 0.9).setOrigin(0, 0.5);
    track.setStrokeStyle(1, PALETTE.goldWarm);
    const handle = this.add.circle(x + 200 + value * 240, y + 8, 10, PALETTE.goldBright, 1);
    handle.setStrokeStyle(2, PALETTE.parchment);
    handle.setInteractive({ useHandCursor: true, draggable: true });
    this.input.setDraggable(handle);
    handle.on("drag", (_p, dragX) => {
      const clamped = Phaser.Math.Clamp(dragX, x + 200, x + 200 + 240);
      handle.x = clamped;
      const v = (clamped - (x + 200)) / 240;
      const next = updateSave((s) => ({ ...s, settings: { ...s.settings, [key]: v } }));
      this.registry.set("save", next);
      applyVolumesFromSave(next);
    });
  }

  _cycler(label, key, options, value, x, y) {
    this.add.text(x, y, label, { fontFamily: "monospace", fontSize: "16px", color: PALETTE_HEX.parchment });
    const valueText = this.add.text(x + 240, y, value, { fontFamily: "monospace", fontSize: "16px", color: PALETTE_HEX.goldBright }).setOrigin(0, 0);
    const btn = makeButton(this, { x: x + 380, y: y + 8, width: 80, height: 26, label: "Cycle", onClick: () => {
      const idx = (options.indexOf(value) + 1) % options.length;
      const newVal = options[idx];
      const next = updateSave((s) => ({ ...s, settings: { ...s.settings, [key]: newVal } }));
      this.registry.set("save", next);
      value = newVal;
      valueText.setText(newVal);
    }});
    void btn;
  }

  _close() {
    this.scene.stop();
    if (this.from === "Pause") this.scene.bringToTop("Pause");
  }
}
