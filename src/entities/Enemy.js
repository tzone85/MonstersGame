import { ENEMY_DEFS } from "../config/balance.js";

const SHEET_FALLBACK_COLORS = {
  toad: 0x6acf6a,
  toads: 0x6acf6a,
  larva: 0xe8a14b,
  egg: 0xe6c69b,
};

export class Enemy {
  constructor(scene, { kind, x, y }) {
    this.scene = scene;
    this.kind = kind;
    const def = ENEMY_DEFS[kind];
    this.def = def;
    this.x = x;
    this.y = y;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.radius = def.radius;
    this.alive = true;

    if (scene.textures.exists(def.sheet)) {
      this.sprite = scene.add.image(x, y, def.sheet);
      this.sprite.setScale(def.scale);
      this.sprite.setOrigin(0.5, 0.75);
    } else {
      this.sprite = scene.add.circle(
        x,
        y,
        def.radius,
        SHEET_FALLBACK_COLORS[def.sheet] ?? 0x8aa,
      );
    }
    this.shadow = scene.add.ellipse(
      x,
      y + def.radius * 0.6,
      def.radius * 1.6,
      def.radius * 0.5,
      0x000000,
      0.32,
    );

    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCircle(def.radius, -def.radius, -def.radius);
    this.sprite.body.setImmovable(false);
    this.sprite.entity = this;
  }

  update(deltaMs, targetX, targetY) {
    if (!this.alive) return;
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const d = Math.hypot(dx, dy) || 1;
    const step = (this.def.speed * deltaMs) / 1000;
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
    this.sprite.setPosition(this.x, this.y);
    this.shadow.setPosition(this.x, this.y + this.def.radius * 0.6);
  }

  takeDamage(amount) {
    if (!this.alive) return false;
    this.hp -= amount;
    this.scene.tweens.add({
      targets: this.sprite,
      duration: 60,
      yoyo: true,
      alpha: { from: 1, to: 0.4 },
    });
    if (this.hp <= 0) {
      this.alive = false;
      return true;
    }
    return false;
  }

  destroy() {
    this.sprite.destroy();
    this.shadow.destroy();
  }
}
