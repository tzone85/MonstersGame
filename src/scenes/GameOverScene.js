import Phaser from "phaser";
import { drawFrame } from "../ui/FFFrame.js";
import { makeButton } from "../ui/Button.js";
import { PALETTE_HEX } from "../config/game.js";

export default class GameOverScene extends Phaser.Scene {
  constructor() { super("GameOver"); }

  init(data) {
    this.victory = !!data?.victory;
    this.timeMs = data?.timeMs ?? 0;
    this.kills = data?.kills ?? 0;
    this.gold = data?.gold ?? 0;
    this.newBest = !!data?.newBest;
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    drawFrame(this, { x: width / 2 - 320, y: 120, width: 640, height: 420 });
    this.add.text(width / 2, 156, this.victory ? "VICTORY" : "DEFEAT", {
      fontFamily: "monospace", fontSize: "44px",
      color: this.victory ? PALETTE_HEX.goldBright : PALETTE_HEX.blood,
    }).setOrigin(0.5);
    const mm = String(Math.floor(this.timeMs / 60_000)).padStart(2, "0");
    const ss = String(Math.floor((this.timeMs % 60_000) / 1000)).padStart(2, "0");
    this.add.text(width / 2, 220,
      [
        `Time:  ${mm}:${ss}`,
        `Kills: ${this.kills}`,
        `Gold:  +${this.gold}`,
        this.newBest ? "NEW BEST TIME!" : "",
      ].join("\n"),
      { fontFamily: "monospace", fontSize: "20px", color: PALETTE_HEX.parchment, align: "center" },
    ).setOrigin(0.5, 0);

    makeButton(this, { x: width / 2 - 110, y: 460, label: "Retry",    onClick: () => this.scene.start("Game", { mode: "run" }) });
    makeButton(this, { x: width / 2 + 110, y: 460, label: "Title",    onClick: () => this.scene.start("Title") });
  }
}
