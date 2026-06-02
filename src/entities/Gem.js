import { PALETTE } from "../config/game.js";

const GEM_COLORS = {
  small:  PALETTE.xpBlue,
  medium: PALETTE.goldBright,
  large:  PALETTE.blood,
};

/**
 * XP gem. Magnet-attracts to the player when within pickup radius.
 * Pooled.
 */
export class Gem {
  constructor(scene) {
    this.scene = scene;
    this.sprite = scene.add.rectangle(0, 0, 10, 10, PALETTE.xpBlue, 1);
    this.sprite.setStrokeStyle(1, PALETTE.parchment, 1);
    this.sprite.setAngle(45);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCircle(8, -8, -8);
    this.sprite.entity = this;
    this.active = false;
    this.sprite.setActive(false).setVisible(false);
  }

  reset({ x, y, size, value }) {
    this.sprite.setPosition(x, y);
    this.sprite.setFillStyle(GEM_COLORS[size] ?? PALETTE.xpBlue, 1);
    const scale = size === "large" ? 1.6 : size === "medium" ? 1.25 : 1;
    this.sprite.setScale(scale);
    this.value = value;
    this.size = size;
    this.active = true;
    this.sprite.setActive(true).setVisible(true);
    this.sprite.body.enable = true;
    this._bobOffset = Math.random() * Math.PI * 2;
    this._tBob = 0;
  }

  update(deltaMs, player) {
    if (!this.active) return;
    this._tBob += deltaMs;
    const bob = Math.sin((this._tBob / 220) + this._bobOffset) * 1.5;
    const dx = player.x - this.sprite.x;
    const dy = player.y - this.sprite.y;
    const d = Math.hypot(dx, dy);
    if (d < player.pickupRadius) {
      const pull = 380 * (1 - d / player.pickupRadius) + 60;
      this.sprite.x += (dx / d) * (pull * deltaMs) / 1000;
      this.sprite.y += (dy / d) * (pull * deltaMs) / 1000;
    }
    this.sprite.setAngle(45 + bob * 10);
  }

  kill() {
    this.active = false;
    this.sprite.setActive(false).setVisible(false);
    this.sprite.body.enable = false;
  }
}
