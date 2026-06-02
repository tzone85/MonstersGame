import { PLAYER_DEFAULTS } from "../config/balance.js";
import { PALETTE } from "../config/game.js";
import { angleToFrameY } from "../systems/steering.js";
import { HEROES } from "../config/balance.js";

/**
 * Player entity. Wraps a Phaser image+collision-circle pair. The wrapping
 * lets us continue to consume the existing 8-row directional sprite-sheet
 * via `angleToFrameY` while integrating with arcade physics for enemy hits.
 *
 * Owns its own simulation state (HP, XP, stats) — apply passives by
 * mutating fields on `this` so unit-tested passive functions stay valid.
 */
export class Player {
  constructor(scene, { x, y, heroId = "bull" } = {}) {
    this.scene = scene;
    this.heroId = heroId;
    Object.assign(this, structuredClone(PLAYER_DEFAULTS));
    this.x = x;
    this.y = y;
    this.target = { x, y };
    this.level = 1;
    this.xp = 0;
    this.gold = 0;
    this.kills = 0;
    this.alive = true;
    this.takenPassives = [];
    this._regenAcc = 0;
    this._lastShotMs = 0;
    this._iframeUntil = 0;

    const heroDef = HEROES.find((h) => h.id === heroId) ?? HEROES[0];
    if (heroDef.mods) heroDef.mods(this);

    // Sprite — prefer bull.png if it loaded; fall back to a colored circle.
    if (scene.textures.exists("bull")) {
      const frameSize = scene.textures.get("bull").getSourceImage().width; // single column
      this.spriteSize = frameSize;
      this.sprite = scene.add.image(x, y - 40, "bull");
      this.sprite.setCrop(0, 0, frameSize, frameSize);
      this.sprite.setOrigin(0.5, 0.5);
      this.sprite.setScale(0.42);
    } else {
      this.sprite = scene.add.graphics();
      this._drawFallback();
      this.sprite.setPosition(x, y - 16);
    }

    this.shadow = scene.add.ellipse(x, y + 14, 56, 14, 0x000000, 0.35);
    this.aura = scene.add.circle(x, y, 8, PALETTE.goldBright, 0.35);
    scene.physics.add.existing(this.aura);
    this.aura.body.setCircle(8);
    this.aura.body.setOffset(-8, -8);
  }

  _drawFallback() {
    const g = this.sprite;
    g.clear();
    g.fillStyle(PALETTE.goldWarm, 1);
    g.fillCircle(0, 0, 16);
    g.lineStyle(2, PALETTE.parchment, 1);
    g.strokeCircle(0, 0, 16);
  }

  /**
   * Set the click-to-move target.
   */
  steerTo(x, y) {
    this.target.x = x;
    this.target.y = y;
  }

  /**
   * Per-frame update. Move toward target, animate, apply regen, etc.
   */
  update(deltaMs) {
    if (!this.alive) return;
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 4) {
      const step = (this.moveSpeed * deltaMs) / 1000;
      const k = Math.min(step / dist, 1);
      this.x += dx * k;
      this.y += dy * k;
    }
    this.aura.setPosition(this.x, this.y);
    this.shadow.setPosition(this.x, this.y + 14);
    if (this.sprite.texture && this.sprite.texture.key === "bull") {
      const frameY = angleToFrameY(Math.atan2(dy, dx));
      const s = this.spriteSize ?? this.sprite.frame.width;
      this.sprite.setCrop(0, frameY * s, s, s);
      this.sprite.setPosition(this.x, this.y - 40);
    } else {
      this.sprite.setPosition(this.x, this.y - 16);
    }

    if (this.regenPerSecond > 0 && this.hp < this.maxHp) {
      this._regenAcc += this.regenPerSecond * (deltaMs / 1000);
      if (this._regenAcc >= 1) {
        const inc = Math.floor(this._regenAcc);
        this.hp = Math.min(this.maxHp, this.hp + inc);
        this._regenAcc -= inc;
      }
    }
  }

  takeDamage(amount, tNow) {
    if (!this.alive) return false;
    if (tNow < this._iframeUntil) return false;
    this.hp = Math.max(0, this.hp - amount);
    this._iframeUntil = tNow + 400;
    if (this.hp === 0) this.alive = false;
    return true;
  }

  destroy() {
    this.sprite.destroy();
    this.shadow.destroy();
    this.aura.destroy();
  }
}
