import Phaser from "phaser";
import { drawFrame } from "../ui/FFFrame.js";
import { makePassiveCard } from "../ui/PassiveCard.js";
import { pickPassiveChoices } from "../systems/passives.js";
import { PALETTE_HEX } from "../config/game.js";

export default class LevelUpScene extends Phaser.Scene {
  constructor() { super("LevelUp"); }

  init(data) {
    this.excludeIds = data?.excludeIds ?? [];
    this.onPick = data?.onPick ?? (() => {});
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.55);
    drawFrame(this, { x: width / 2 - 420, y: height * 0.18, width: 840, height: 60 });
    this.add.text(width / 2, height * 0.18 + 16, "Level up — choose a passive", {
      fontFamily: "monospace", fontSize: "22px", color: PALETTE_HEX.goldBright,
    }).setOrigin(0.5);

    const choices = pickPassiveChoices(3, { excludeIds: this.excludeIds });
    const startX = width / 2 - 280;
    choices.forEach((p, i) => {
      makePassiveCard(this, {
        x: startX + i * 280,
        y: height / 2 + 20,
        passive: p,
        onSelect: () => this.onPick(p.id),
      });
    });
  }
}
