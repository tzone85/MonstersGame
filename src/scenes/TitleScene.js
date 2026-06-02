import Phaser from "phaser";
import { PALETTE, PALETTE_HEX } from "../config/game.js";
import { makeButton } from "../ui/Button.js";
import { drawFrame } from "../ui/FFFrame.js";
import { typewriter } from "../ui/Typewriter.js";
import { getAudio, playTrack, stopTrack } from "../audio/index.js";

export default class TitleScene extends Phaser.Scene {
  constructor() { super("Title"); }

  create() {
    const { width, height } = this.scale;
    const save = this.registry.get("save");

    // Background — tinted parallax
    if (this.textures.exists("background")) {
      this.bg = this.add.image(width / 2, height / 2, "background");
      this.bg.setDisplaySize(width * 1.05, height * 1.05);
      this.bg.setTint(0x4a5fa8);
      this.tweens.add({ targets: this.bg, x: width / 2 + 30, duration: 14000, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    } else {
      this.add.rectangle(width / 2, height / 2, width, height, PALETTE.navyDeep);
    }
    this.add.rectangle(width / 2, height / 2, width, height, PALETTE.navyDeep, 0.45);

    // Title text
    this.add.text(width / 2, height * 0.22, "MONSTERS", {
      fontFamily: "monospace",
      fontSize: "84px",
      color: PALETTE_HEX.goldBright,
      stroke: PALETTE_HEX.navyDeep,
      strokeThickness: 8,
    }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.32, "— A Survivor's Tale —", {
      fontFamily: "monospace",
      fontSize: "22px",
      color: PALETTE_HEX.parchment,
    }).setOrigin(0.5);

    // Tagline frame
    drawFrame(this, { x: width / 2 - 360, y: height * 0.38, width: 720, height: 56 });
    typewriter(this, {
      x: width / 2 - 340,
      y: height * 0.38 + 16,
      text: "Press start. Survive the swarm. Grow stronger after each fall.",
      fontSize: 16,
      wrapWidth: 690,
    });

    // Menu
    const cx = width / 2;
    let row = height * 0.55;
    const step = 56;
    makeButton(this, { x: cx, y: row, label: "▶ New Run",   onClick: () => this._enterRun() });
    row += step;
    makeButton(this, { x: cx, y: row, label: save.settings.hasSeenTutorial ? "Replay Tutorial" : "Tutorial (recommended)", onClick: () => this._enterTutorial() });
    row += step;
    makeButton(this, { x: cx, y: row, label: "Shop",        onClick: () => this.scene.start("Shop") });
    row += step;
    makeButton(this, { x: cx, y: row, label: "Settings",    onClick: () => this.scene.launch("Settings", { from: "Title" }) });
    row += step;
    makeButton(this, { x: cx, y: row, label: "Credits",     onClick: () => this._showCredits() });

    // Stats panel
    drawFrame(this, { x: 24, y: height - 96, width: 320, height: 72 });
    this.add.text(40, height - 84, this._statsText(save), {
      fontFamily: "monospace", fontSize: "12px", color: PALETTE_HEX.parchment,
    });

    // Resume audio on first input + start BGM
    const startBgm = async () => {
      await getAudio().resume();
      playTrack("title");
      this.input.off("pointerdown", startBgm);
      this.input.keyboard.off("keydown", startBgm);
    };
    this.input.once("pointerdown", startBgm);
    this.input.keyboard.once("keydown", startBgm);

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => stopTrack());
  }

  _statsText(save) {
    const best = save.records.bestTimeMs;
    const mm = String(Math.floor(best / 60_000)).padStart(2, "0");
    const ss = String(Math.floor((best % 60_000) / 1000)).padStart(2, "0");
    return `Gold: ${save.gold}    Best: ${mm}:${ss}    Kills: ${save.records.bestKills}    Runs: ${save.records.totalRuns}`;
  }

  _enterRun() {
    stopTrack();
    this.scene.start("Game", { mode: "run", heroId: this.registry.get("save").selectedHero });
  }

  _enterTutorial() {
    stopTrack();
    this.scene.start("Tutorial");
  }

  _showCredits() {
    const { width, height } = this.scale;
    const w = 640, h = 320;
    const frame = drawFrame(this, { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h });
    const text = this.add.text(width / 2, height / 2,
      [
        "MonstersGame",
        "",
        "Code: Thando Mini",
        "Engine: Phaser 3",
        "Audio: hand-sequenced chiptune",
        "Pixel sprites: project art",
        "",
        "Click anywhere to close.",
      ].join("\n"),
      { fontFamily: "monospace", fontSize: "16px", color: PALETTE_HEX.parchment, align: "center" },
    ).setOrigin(0.5);
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, PALETTE.shadow, 0.0).setInteractive();
    overlay.on("pointerdown", () => { frame.destroy(); text.destroy(); overlay.destroy(); });
  }
}
