import { PALETTE, PALETTE_HEX } from "../config/game.js";
import { playSfx } from "../audio/index.js";

export function makePassiveCard(scene, { x, y, width = 240, height = 200, passive, onSelect } = {}) {
  const c = scene.add.container(x, y);
  const bg = scene.add.graphics();
  const drawBg = (hover) => {
    bg.clear();
    bg.fillStyle(hover ? PALETTE.navy : PALETTE.navyDeep, 0.95);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
    bg.lineStyle(2, hover ? PALETTE.goldBright : PALETTE.goldWarm, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
    bg.lineStyle(1, PALETTE.goldWarm, 0.6);
    bg.strokeRoundedRect(-width / 2 + 6, -height / 2 + 6, width - 12, height - 12, 8);
  };
  drawBg(false);
  const title = scene.add.text(0, -height / 2 + 22, passive.name, {
    fontFamily: "monospace",
    fontSize: "20px",
    color: PALETTE_HEX.goldBright,
  }).setOrigin(0.5);
  const desc = scene.add.text(0, 8, passive.desc, {
    fontFamily: "monospace",
    fontSize: "14px",
    color: PALETTE_HEX.parchment,
    align: "center",
    wordWrap: { width: width - 24 },
  }).setOrigin(0.5);
  const cta = scene.add.text(0, height / 2 - 22, "▶ choose", {
    fontFamily: "monospace",
    fontSize: "14px",
    color: PALETTE_HEX.parchmentDim,
  }).setOrigin(0.5);
  c.add([bg, title, desc, cta]);
  c.setSize(width, height);
  c.setInteractive({ useHandCursor: true });
  c.on("pointerover", () => { drawBg(true); playSfx("uiHover"); });
  c.on("pointerout",  () => drawBg(false));
  c.on("pointerdown", () => { playSfx("uiSelect"); onSelect?.(passive); });
  return c;
}
