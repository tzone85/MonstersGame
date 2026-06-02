import { PALETTE } from "../config/game.js";

/**
 * Player-fired projectile. Pooled — `reset()` re-arms instead of allocating.
 */
export class Projectile {
  constructor(scene) {
    this.scene = scene;
    this.sprite = scene.add.circle(0, 0, 6, PALETTE.goldBright, 1);
    this.glow = scene.add.circle(0, 0, 10, PALETTE.goldWarm, 0.4);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCircle(8, -8, -8);
    this.sprite.entity = this;
    this.active = false;
    this.sprite.setActive(false).setVisible(false);
    this.glow.setActive(false).setVisible(false);
  }

  reset({ x, y, dirX, dirY, speed, damage, pierce, ttlMs }) {
    this.sprite.setPosition(x, y);
    this.glow.setPosition(x, y);
    this.sprite.setActive(true).setVisible(true);
    this.glow.setActive(true).setVisible(true);
    this.sprite.body.enable = true;
    this.vx = dirX * speed;
    this.vy = dirY * speed;
    this.damage = damage;
    this.pierce = pierce;
    this.ttl = ttlMs;
    this.active = true;
    this.hits = new WeakSet();
  }

  update(deltaMs) {
    if (!this.active) return;
    this.ttl -= deltaMs;
    if (this.ttl <= 0) {
      this.kill();
      return;
    }
    this.sprite.x += (this.vx * deltaMs) / 1000;
    this.sprite.y += (this.vy * deltaMs) / 1000;
    this.glow.setPosition(this.sprite.x, this.sprite.y);
  }

  registerHit(enemy) {
    if (this.hits.has(enemy)) return false;
    this.hits.add(enemy);
    if (this.pierce <= 0) {
      this.kill();
    } else {
      this.pierce -= 1;
    }
    return true;
  }

  kill() {
    this.active = false;
    this.sprite.setActive(false).setVisible(false);
    this.glow.setActive(false).setVisible(false);
    this.sprite.body.enable = false;
  }
}
