import Phaser from "phaser";
import { drawFrame } from "../ui/FFFrame.js";
import { typewriter } from "../ui/Typewriter.js";
import { makeButton } from "../ui/Button.js";
import { PALETTE, PALETTE_HEX } from "../config/game.js";
import { Player } from "../entities/Player.js";
import { Enemy } from "../entities/Enemy.js";
import { Projectile } from "../entities/Projectile.js";
import { Gem } from "../entities/Gem.js";
import { planVolley } from "../systems/autoAttack.js";
import { applyXpGain } from "../systems/xpCurve.js";
import { applyPassive } from "../systems/passives.js";
import { playSfx, playTrack, stopTrack } from "../audio/index.js";
import { updateSave } from "../save/storage.js";
import { FLAGS } from "../config/flags.js";

/**
 * Self-contained tutorial. Runs a stripped game loop with scripted gates so
 * the dialog only advances after the player performs each action.
 */
export default class TutorialScene extends Phaser.Scene {
  constructor() { super("Tutorial"); }

  create() {
    const { width, height } = this.scale;
    this._setupWorld();
    this._setupPools();
    this._setupPlayer();
    this._setupOverlaps();
    this._setupInput();

    this.stage = 0;
    this.lastShotMs = 0;
    this.tutorialEnemies = [];
    this.tutorialGems = [];

    this.dialog = this._dialog("Welcome, hero!\nClick anywhere on the field to move.");
    this.arrow = this._arrow(width / 2 + 220, height / 2);

    this.input.on("pointerdown", () => {
      if (this.stage === 0) this._advanceTo(1);
    });
    playTrack("dungeon");

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => stopTrack());

    makeButton(this, { x: width - 110, y: 36, width: 180, height: 32, label: "Skip Tutorial →", onClick: () => this._skip() });
  }

  _setupWorld() {
    const { width, height } = this.scale;
    if (this.textures.exists("background")) {
      const bg = this.add.image(width / 2, height / 2, "background");
      bg.setDisplaySize(width, height);
      bg.setTint(0x88a4ff);
      bg.setAlpha(0.85);
    } else {
      this.add.rectangle(width / 2, height / 2, width, height, PALETTE.navyDeep);
    }
  }

  _setupPools() {
    this.projectiles = Array.from({ length: 20 }, () => new Projectile(this));
    this.gems = Array.from({ length: 30 }, () => new Gem(this));
    this.projectileGroup = this.physics.add.group(this.projectiles.map((p) => p.sprite));
    this.gemGroup = this.physics.add.group(this.gems.map((g) => g.sprite));
  }

  _setupPlayer() {
    const { width, height } = this.scale;
    this.player = new Player(this, { x: width / 2, y: height / 2 });
  }

  _setupOverlaps() {
    this.enemyGroup = this.physics.add.group();
    this.physics.add.overlap(this.projectileGroup, this.enemyGroup, (projSprite, enemySprite) => {
      const proj = projSprite.entity;
      const enemy = enemySprite.entity;
      if (!proj.active || !enemy.alive) return;
      if (!proj.registerHit(enemy)) return;
      const killed = enemy.takeDamage(proj.damage);
      playSfx("hit");
      if (killed) this._onTutorialKill(enemy);
    });
    this.physics.add.overlap(this.player.aura, this.gemGroup, (_aura, gemSprite) => {
      const gem = gemSprite.entity;
      if (!gem.active) return;
      gem.kill();
      playSfx("gem");
      const next = applyXpGain({ level: this.player.level, xp: this.player.xp }, 999); // force level-up in tutorial
      this.player.level = next.level;
      this.player.xp = next.xp;
      if (next.levelUps > 0) {
        playSfx("levelUp");
        if (this.stage === 3) this._advanceTo(4);
      }
    });
  }

  _setupInput() {
    this.input.on("pointerdown", (p) => this.player.steerTo(p.worldX, p.worldY));
    this.input.on("pointermove", (p) => { if (p.isDown) this.player.steerTo(p.worldX, p.worldY); });
  }

  update(_t, deltaMs) {
    this.player.update(deltaMs);
    for (let i = this.tutorialEnemies.length - 1; i >= 0; i--) {
      const e = this.tutorialEnemies[i];
      if (!e.alive) { e.destroy(); this.tutorialEnemies.splice(i, 1); continue; }
      e.update(deltaMs, this.player.x, this.player.y);
    }
    for (const p of this.projectiles) if (p.active) p.update(deltaMs);
    for (const g of this.gems) if (g.active) g.update(deltaMs, this.player);
    this._autoAttack(this.time.now);

    // Stage 1 → 2: after first move
    if (this.stage === 1 && Math.hypot(this.player.x - this.scale.width / 2, this.player.y - this.scale.height / 2) > 80) {
      this._advanceTo(2);
    }
  }

  _autoAttack(tMs) {
    const result = planVolley({
      tMs,
      lastShotMs: this.lastShotMs,
      player: {
        x: this.player.x, y: this.player.y,
        attackRange: this.player.attackRange,
        attackInterval: this.player.attackInterval,
        projectilesPerVolley: this.player.projectilesPerVolley,
      },
      enemies: this.tutorialEnemies.filter((e) => e.alive).map((e) => ({ x: e.x, y: e.y })),
    });
    if (!result) return;
    this.lastShotMs = result.nextLastShotMs;
    for (const target of result.targets) {
      const proj = this.projectiles.find((p) => !p.active);
      if (!proj) break;
      const dx = target.x - this.player.x;
      const dy = target.y - this.player.y;
      const d = Math.hypot(dx, dy) || 1;
      proj.reset({
        x: this.player.x, y: this.player.y, dirX: dx / d, dirY: dy / d,
        speed: this.player.projectileSpeed, damage: 100,
        pierce: 0, ttlMs: 1100,
      });
    }
  }

  _onTutorialKill(enemy) {
    this.tutorialEnemies = this.tutorialEnemies.filter((e) => e !== enemy);
    const gem = this.gems.find((g) => !g.active);
    if (gem) gem.reset({ x: enemy.x, y: enemy.y, value: 999, size: "medium" });
    if (this.stage === 2 && this.tutorialEnemies.length === 0) this._advanceTo(3);
    if (this.stage === 5 && this.tutorialEnemies.length === 0) this._finish();
  }

  _advanceTo(stage) {
    this.stage = stage;
    if (FLAGS.fastTutorial && stage < 5) { this._advanceTo(stage + 1); return; }
    if (this.dialog) this.dialog.destroy();
    if (this.arrow) this.arrow.destroy();
    const { width, height } = this.scale;
    if (stage === 1) {
      // Already moved — celebrate
      this.dialog = this._dialog("Good. Enemies will swarm you. You attack automatically — keep moving.");
      this.time.delayedCall(1400, () => this._advanceTo(2));
    } else if (stage === 2) {
      this.dialog = this._dialog("Defeat the slime to learn auto-attack.");
      this._spawnEnemy("toad", width * 0.7, height * 0.5);
    } else if (stage === 3) {
      this.dialog = this._dialog("Pick up the gem. Gems fill your XP bar.");
    } else if (stage === 4) {
      this.dialog = this._dialog("Level up! Choose a passive to grow stronger.");
      this.scene.pause();
      this.scene.launch("LevelUp", {
        excludeIds: this.player.takenPassives,
        onPick: (id) => {
          applyPassive(this.player, id);
          this.scene.stop("LevelUp");
          this.scene.resume();
          this._advanceTo(5);
        },
      });
    } else if (stage === 5) {
      this.dialog = this._dialog("One last wave. Survive.");
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        this._spawnEnemy("toad", width / 2 + Math.cos(angle) * 300, height / 2 + Math.sin(angle) * 300);
      }
    }
  }

  _spawnEnemy(kind, x, y) {
    const e = new Enemy(this, { kind, x, y });
    this.tutorialEnemies.push(e);
    this.enemyGroup.add(e.sprite);
  }

  _dialog(text) {
    const { width, height } = this.scale;
    const w = 720, h = 110;
    const c = this.add.container((width - w) / 2, height - h - 30);
    const frame = drawFrame(this, { x: 0, y: 0, width: w, height: h });
    c.add(frame);
    const t = typewriter(this, { x: 18, y: 16, text, fontSize: 18, wrapWidth: w - 36 });
    c.add(t);
    return c;
  }

  _arrow(x, y) {
    const arrow = this.add.text(x, y, "←", { fontFamily: "monospace", fontSize: "36px", color: PALETTE_HEX.goldBright });
    this.tweens.add({ targets: arrow, x: x + 16, duration: 600, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    return arrow;
  }

  _finish() {
    const save = updateSave((s) => ({ ...s, settings: { ...s.settings, hasSeenTutorial: true } }));
    this.registry.set("save", save);
    this._dialog("Tutorial complete. Press start when ready.");
    this.time.delayedCall(1600, () => this.scene.start("Title"));
  }

  _skip() {
    const save = updateSave((s) => ({ ...s, settings: { ...s.settings, hasSeenTutorial: true } }));
    this.registry.set("save", save);
    this.scene.start("Title");
  }
}
