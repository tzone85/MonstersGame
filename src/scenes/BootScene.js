import Phaser from "phaser";
import { loadSave } from "../save/storage.js";
import { applyVolumesFromSave } from "../audio/index.js";
import { PALETTE, PALETTE_HEX } from "../config/game.js";

/**
 * Asset preloader. Existing PNGs live under public/ and ship as static files.
 * If any fail to load we keep going — entities have circle fallbacks.
 */
export default class BootScene extends Phaser.Scene {
  constructor() { super("Boot"); }

  preload() {
    const tryImage = (key, path) => {
      this.load.image(key, path).on("loaderror", () => {
        console.warn(`asset missing, using fallback: ${path}`);
      });
    };
    tryImage("background", "./background.png");
    tryImage("bull",       "./bull.png");
    tryImage("toads",      "./toads.png");
    tryImage("toad",       "./toad.png");
    tryImage("larva",      "./larva.png");
    tryImage("egg",        "./egg.png");
    tryImage("obstacles",  "./obstacles.png");
    tryImage("overlay",    "./overlay.png");

    // Loader progress UI
    const { width, height } = this.scale;
    const bar = this.add.rectangle(width / 2, height / 2 + 10, 320, 8, PALETTE.parchment, 0.25);
    bar.setStrokeStyle(1, PALETTE.goldWarm);
    const fill = this.add.rectangle(width / 2 - 160 + 2, height / 2 + 10, 0, 4, PALETTE.goldBright);
    fill.setOrigin(0, 0.5);
    const label = this.add.text(width / 2, height / 2 - 16, "Loading…", {
      fontFamily: "monospace",
      fontSize: "18px",
      color: PALETTE_HEX.goldBright,
    }).setOrigin(0.5);
    this.load.on("progress", (p) => fill.setSize(316 * p, 4));
    this.load.on("complete", () => label.setText("Ready"));
  }

  create() {
    const save = loadSave();
    this.registry.set("save", save);
    applyVolumesFromSave(save);
    this.scene.start("Title");
  }
}
