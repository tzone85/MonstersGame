import { PALETTE, PALETTE_HEX } from "../config/game.js";
import { playSfx } from "../audio/index.js";

/**
 * Minimal interactive button. Returns a Container with `setEnabled`.
 */
export function makeButton(scene, { x, y, width = 240, height = 44, label, onClick, enabled = true } = {}) {
  const container = scene.add.container(x, y);
  const bg = scene.add.graphics();
  const drawBg = (hover) => {
    bg.clear();
    bg.fillStyle(hover ? PALETTE.navy : PALETTE.navyDeep, 0.92);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
    bg.lineStyle(2, hover ? PALETTE.goldBright : PALETTE.goldWarm, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
  };
  drawBg(false);
  const text = scene.add.text(0, 0, label, {
    fontFamily: "monospace",
    fontSize: "18px",
    color: PALETTE_HEX.parchment,
  }).setOrigin(0.5);
  container.add([bg, text]);
  container.setSize(width, height);
  container.setInteractive({ useHandCursor: true });
  container.on("pointerover", () => { drawBg(true); playSfx("uiHover"); });
  container.on("pointerout",  () => drawBg(false));
  container.on("pointerdown", () => {
    if (!container.input.enabled) return;
    playSfx("uiSelect");
    onClick?.();
  });
  container.setEnabled = (on) => {
    container.input.enabled = on;
    text.setAlpha(on ? 1 : 0.5);
  };
  container.setEnabled(enabled);
  return container;
}
