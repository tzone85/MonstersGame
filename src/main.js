import Phaser from "phaser";
import "./main.css";

import { RESOLUTION, PALETTE } from "./config/game.js";
import BootScene from "./scenes/BootScene.js";
import TitleScene from "./scenes/TitleScene.js";
import TutorialScene from "./scenes/TutorialScene.js";
import GameScene from "./scenes/GameScene.js";
import HUDScene from "./scenes/HUDScene.js";
import LevelUpScene from "./scenes/LevelUpScene.js";
import PauseScene from "./scenes/PauseScene.js";
import GameOverScene from "./scenes/GameOverScene.js";
import ShopScene from "./scenes/ShopScene.js";
import SettingsScene from "./scenes/SettingsScene.js";

const config = {
  type: Phaser.AUTO,
  parent: "game-root",
  backgroundColor: `#${PALETTE.navyDeep.toString(16).padStart(6, "0")}`,
  width: RESOLUTION.width,
  height: RESOLUTION.height,
  pixelArt: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: { debug: false, gravity: { x: 0, y: 0 } },
  },
  scene: [
    BootScene,
    TitleScene,
    TutorialScene,
    GameScene,
    HUDScene,
    LevelUpScene,
    PauseScene,
    GameOverScene,
    ShopScene,
    SettingsScene,
  ],
};

const game = new Phaser.Game(config);
if (typeof window !== "undefined") {
  window.__game = game;
  // Right-click on Windows/Linux browsers opens a native context menu over
  // the canvas — suppress it so gameplay isn't interrupted.
  window.addEventListener("contextmenu", (e) => {
    const root = document.getElementById("game-root");
    if (root && root.contains(e.target)) e.preventDefault();
  });
  // Block browser zoom shortcuts that would scale the canvas off-screen.
  window.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey) e.preventDefault();
    },
    { passive: false },
  );
}
