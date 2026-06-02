import Phaser from "phaser";
import { drawFrame } from "../ui/FFFrame.js";
import { makeButton } from "../ui/Button.js";
import { PALETTE_HEX } from "../config/game.js";

export default class PauseScene extends Phaser.Scene {
  constructor() { super("Pause"); }

  init(data) { this.from = data?.from ?? "Game"; }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);
    drawFrame(this, { x: width / 2 - 220, y: height / 2 - 150, width: 440, height: 300 });
    this.add.text(width / 2, height / 2 - 110, "Paused", {
      fontFamily: "monospace", fontSize: "32px", color: PALETTE_HEX.goldBright,
    }).setOrigin(0.5);
    makeButton(this, { x: width / 2, y: height / 2 - 40, label: "Resume",    onClick: () => this._resume() });
    makeButton(this, { x: width / 2, y: height / 2 + 16, label: "Settings",  onClick: () => this.scene.launch("Settings", { from: "Pause" }) });
    makeButton(this, { x: width / 2, y: height / 2 + 72, label: "Quit to Title", onClick: () => this._quit() });

    this.input.keyboard.on("keydown-ESC", () => this._resume());
  }

  _resume() {
    this.scene.stop();
    this.scene.resume(this.from);
  }

  _quit() {
    this.scene.stop(this.from);
    this.scene.stop();
    this.scene.start("Title");
  }
}
