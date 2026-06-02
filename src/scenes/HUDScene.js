import Phaser from "phaser";
import { PALETTE, PALETTE_HEX } from "../config/game.js";
import { drawBar, drawFrame } from "../ui/FFFrame.js";
import { xpBarRatio } from "../systems/xpCurve.js";

export default class HUDScene extends Phaser.Scene {
  constructor() { super("HUD"); }

  create() {
    const { width, height } = this.scale;
    // Top frame
    drawFrame(this, { x: 12, y: 12, width: 360, height: 84 });
    this.hpLabel  = this.add.text(28, 24, "HP", { fontFamily: "monospace", fontSize: "14px", color: PALETTE_HEX.parchment });
    this.xpLabel  = this.add.text(28, 60, "XP", { fontFamily: "monospace", fontSize: "14px", color: PALETTE_HEX.parchment });
    this.hpBarHolder = this.add.container(60, 28);
    this.xpBarHolder = this.add.container(60, 64);

    // Top-right
    drawFrame(this, { x: width - 252, y: 12, width: 240, height: 84 });
    this.timeText = this.add.text(width - 240, 22, "00:00", { fontFamily: "monospace", fontSize: "28px", color: PALETTE_HEX.goldBright });
    this.statsText = this.add.text(width - 240, 56, "", { fontFamily: "monospace", fontSize: "14px", color: PALETTE_HEX.parchment });

    // Bottom center hint
    this.hint = this.add.text(width / 2, height - 26, "Click to move · ESC pause", {
      fontFamily: "monospace", fontSize: "13px", color: PALETTE_HEX.parchmentDim,
    }).setOrigin(0.5);

    // Subscribe to game ticks
    const game = this.scene.get("Game");
    this._listener = (state) => this._redraw(state);
    game.events.on("hud:tick", this._listener);
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => game.events.off("hud:tick", this._listener));
  }

  _redraw(s) {
    // Bars are graphics — rebuild each tick (cheap; small surface).
    this.hpBarHolder.removeAll(true);
    this.xpBarHolder.removeAll(true);
    const hpBar = drawBar(this, { x: 0, y: 0, width: 280, height: 18, ratio: s.hp / s.maxHp, fillColor: PALETTE.hpGreen });
    this.hpBarHolder.add(hpBar);
    const xpBar = drawBar(this, { x: 0, y: 0, width: 280, height: 14, ratio: xpBarRatio(s.level, s.xp), fillColor: PALETTE.xpBlue });
    this.xpBarHolder.add(xpBar);
    this.hpLabel.setText(`HP ${s.hp}/${s.maxHp}`);
    this.xpLabel.setText(`L${s.level}`);

    const remain = Math.max(0, s.runLengthMs - s.timeMs);
    const mm = String(Math.floor(remain / 60_000)).padStart(2, "0");
    const ss = String(Math.floor((remain % 60_000) / 1000)).padStart(2, "0");
    this.timeText.setText(`${mm}:${ss}`);
    this.statsText.setText(`Kills ${s.kills}    Gold ${s.goldRun}\nWave: ${s.waveName}`);
  }
}
