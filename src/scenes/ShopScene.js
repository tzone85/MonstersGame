import Phaser from "phaser";
import { drawFrame } from "../ui/FFFrame.js";
import { makeButton } from "../ui/Button.js";
import { PALETTE, PALETTE_HEX } from "../config/game.js";
import { HEROES, STARTING_PASSIVES, PERKS } from "../config/balance.js";
import { isUnlocked, purchase } from "../save/unlocks.js";
import { updateSave } from "../save/storage.js";
import { playSfx } from "../audio/index.js";

export default class ShopScene extends Phaser.Scene {
  constructor() { super("Shop"); }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, PALETTE.navyDeep);
    drawFrame(this, { x: 24, y: 24, width: width - 48, height: height - 48 });
    this.add.text(width / 2, 56, "SHOP", { fontFamily: "monospace", fontSize: "32px", color: PALETTE_HEX.goldBright }).setOrigin(0.5);
    this.goldText = this.add.text(width - 60, 60, "", { fontFamily: "monospace", fontSize: "20px", color: PALETTE_HEX.goldBright }).setOrigin(1, 0.5);
    this._renderGold();

    this._renderColumn("Heroes",            HEROES,            "hero",            56,  140);
    this._renderColumn("Starting Passives", STARTING_PASSIVES, "startingPassive", 480, 140);
    this._renderColumn("Perks",             PERKS,             "perk",            904, 140);

    makeButton(this, { x: width / 2, y: height - 56, label: "← Back", onClick: () => this.scene.start("Title") });
  }

  _renderGold() {
    const save = this.registry.get("save");
    this.goldText.setText(`Gold: ${save.gold}`);
  }

  _renderColumn(title, items, kind, x, yStart) {
    this.add.text(x, yStart - 30, title, { fontFamily: "monospace", fontSize: "18px", color: PALETTE_HEX.parchment });
    items.forEach((item, idx) => this._renderItem(item, kind, x, yStart + idx * 110));
  }

  _renderItem(item, kind, x, y) {
    const save = this.registry.get("save");
    const owned = isUnlocked(save, kind, item.id);
    drawFrame(this, { x, y, width: 360, height: 96 });
    this.add.text(x + 14, y + 10, item.name, { fontFamily: "monospace", fontSize: "16px", color: PALETTE_HEX.goldBright });
    this.add.text(x + 14, y + 36, item.desc ?? "", { fontFamily: "monospace", fontSize: "12px", color: PALETTE_HEX.parchment, wordWrap: { width: 340 } });
    const cta = owned ? "OWNED" : `Buy (${item.cost}g)`;
    const btn = makeButton(this, { x: x + 280, y: y + 64, width: 140, height: 26, label: cta, onClick: () => this._buy(kind, item.id) });
    if (owned || save.gold < (item.cost ?? Infinity)) btn.setEnabled(!owned && save.gold >= item.cost);

    if (kind === "hero" && save.selectedHero !== item.id && owned) {
      makeButton(this, { x: x + 280, y: y + 28, width: 140, height: 22, label: "Select", onClick: () => this._select(item.id) });
    } else if (kind === "hero" && save.selectedHero === item.id) {
      this.add.text(x + 280, y + 28, "Selected", { fontFamily: "monospace", fontSize: "12px", color: PALETTE_HEX.goldBright }).setOrigin(0.5);
    }
  }

  _buy(kind, id) {
    const next = updateSave((s) => {
      const result = purchase(s, kind, id);
      if (!result.ok) return s;
      playSfx("uiSelect");
      return result.save;
    });
    this.registry.set("save", next);
    this.scene.restart();
  }

  _select(heroId) {
    const next = updateSave((s) => ({ ...s, selectedHero: heroId }));
    this.registry.set("save", next);
    this.scene.restart();
  }
}
