import Phaser from "phaser";
import { PALETTE } from "../config/game.js";
import { Player } from "../entities/Player.js";
import { Enemy } from "../entities/Enemy.js";
import { Projectile } from "../entities/Projectile.js";
import { Gem } from "../entities/Gem.js";
import {
  tickSpawns,
  spawnPointOnRing,
  currentWave,
} from "../systems/waveSpawner.js";
import { planVolley } from "../systems/autoAttack.js";
import { applyXpGain } from "../systems/xpCurve.js";
import { applyPassive } from "../systems/passives.js";
import { ENEMY_DEFS, RUN_LENGTH_MS } from "../config/balance.js";
import { playSfx, playTrack, stopTrack } from "../audio/index.js";
import { updateSave } from "../save/storage.js";
import { FLAGS } from "../config/flags.js";

const PROJECTILE_POOL = 80;
const GEM_POOL = 200;
const MAX_ENEMIES = 140;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("Game");
  }

  init(data) {
    this.mode = data?.mode ?? "run";
    this.heroId = data?.heroId ?? "bull";
    this.tutorial = data?.tutorial ?? null;
  }

  create() {
    const { width, height } = this.scale;
    this.runStartMs = this.time.now;
    this.lastSpawnMs = 0;
    this.lastShotMs = 0;
    this.lastBossWarnAt = -1;
    this.bossActive = false;
    this.enemies = [];
    this.killCount = 0;
    this.goldEarned = 0;
    this.paused = false;
    this.physics.world.setBounds(0, 0, width, height);

    this._setupWorld();
    this._setupPools();
    this._setupPlayer();
    this._setupInput();
    this._setupOverlaps();

    // HUD overlay
    this.scene.launch("HUD");

    // BGM
    playTrack("dungeon");

    // Tutorial hook — if a script is supplied, run it.
    if (this.tutorial) this.tutorial.start(this);

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      stopTrack();
      this.scene.stop("HUD");
    });
    this.events.on(Phaser.Scenes.Events.PAUSE, () => (this.paused = true));
    this.events.on(Phaser.Scenes.Events.RESUME, () => (this.paused = false));

    this.events.emit("run:start");
  }

  _setupWorld() {
    const { width, height } = this.scale;
    if (this.textures.exists("background")) {
      this.bg = this.add.image(width / 2, height / 2, "background");
      this.bg.setDisplaySize(width, height);
      this.bg.setTint(0x88a4ff);
      this.bg.setAlpha(0.85);
    } else {
      this.add.rectangle(
        width / 2,
        height / 2,
        width,
        height,
        PALETTE.navyDeep,
      );
    }
    // Vignette
    this.vignette = this.add.graphics();
    this.vignette.fillStyle(0x000000, 0.35);
    this.vignette.fillRect(0, 0, width, height);
    this.vignette.blendMode = Phaser.BlendModes.MULTIPLY;
    this.vignette.setDepth(1000);
  }

  _setupPools() {
    this.projectiles = Array.from(
      { length: PROJECTILE_POOL },
      () => new Projectile(this),
    );
    this.gems = Array.from({ length: GEM_POOL }, () => new Gem(this));
    this.projectileGroup = this.physics.add.group(
      this.projectiles.map((p) => p.sprite),
    );
    this.gemGroup = this.physics.add.group(this.gems.map((g) => g.sprite));
  }

  _setupPlayer() {
    const { width, height } = this.scale;
    this.player = new Player(this, {
      x: width / 2,
      y: height / 2,
      heroId: this.heroId,
    });
  }

  _setupInput() {
    this.input.on("pointerdown", (p) =>
      this.player.steerTo(p.worldX, p.worldY),
    );
    this.input.on("pointermove", (p) => {
      if (p.isDown) this.player.steerTo(p.worldX, p.worldY);
    });
    this.input.keyboard.on("keydown-ESC", () => this._togglePause());
    this.input.keyboard.on("keydown-P", () => this._togglePause());
    if (FLAGS.debug)
      this.input.keyboard.on("keydown-L", () => this._debugLevelUp());
  }

  _setupOverlaps() {
    this.enemyGroup = this.physics.add.group();
    this.physics.add.overlap(
      this.projectileGroup,
      this.enemyGroup,
      (projSprite, enemySprite) => {
        const proj = projSprite.entity;
        const enemy = enemySprite.entity;
        if (!proj.active || !enemy.alive) return;
        if (!proj.registerHit(enemy)) return;
        const killed = enemy.takeDamage(proj.damage);
        playSfx("hit");
        if (killed) this._onEnemyKill(enemy);
      },
    );
    this.physics.add.overlap(
      this.player.aura,
      this.enemyGroup,
      (_aura, enemySprite) => {
        const enemy = enemySprite.entity;
        if (!enemy.alive) return;
        const dealt = this.player.takeDamage(enemy.def.damage, this.time.now);
        if (dealt) {
          playSfx("playerHit");
          this._screenShake(
            220,
            this.registry.get("save")?.settings.screenShake ?? "low",
          );
        }
      },
    );
    this.physics.add.overlap(
      this.player.aura,
      this.gemGroup,
      (_aura, gemSprite) => {
        const gem = gemSprite.entity;
        if (!gem.active) return;
        this._collectGem(gem);
      },
    );
  }

  update(_t, deltaMs) {
    if (this.paused) return;
    const tMs = this.time.now - this.runStartMs;
    if (!this.player.alive) {
      this._endRun(tMs);
      return;
    }

    if (tMs >= RUN_LENGTH_MS && !this._victoryFired) {
      this._victoryFired = true;
      this._endRun(tMs, true);
      return;
    }

    this.player.update(deltaMs);
    this._spawnEnemies(tMs);
    this._updateEnemies(deltaMs);
    this._autoAttack(tMs);
    this._updateProjectiles(deltaMs);
    this._updateGems(deltaMs);
    this._maybeBossWarn(tMs);

    // Broadcast HUD state
    this.events.emit("hud:tick", this._hudState(tMs));
  }

  _hudState(tMs) {
    return {
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      xp: this.player.xp,
      level: this.player.level,
      goldRun: this.goldEarned,
      kills: this.killCount,
      timeMs: tMs,
      runLengthMs: RUN_LENGTH_MS,
      waveName: currentWave(tMs).enemies.join("+"),
    };
  }

  _spawnEnemies(tMs) {
    if (this.enemies.length >= MAX_ENEMIES) return;
    const { spawns, nextLastSpawnMs } = tickSpawns({
      tMs,
      lastSpawnMs: this.lastSpawnMs,
    });
    if (spawns.length === 0) return;
    this.lastSpawnMs = nextLastSpawnMs;
    for (const kind of spawns) {
      const { x, y } = spawnPointOnRing({
        width: this.scale.width,
        height: this.scale.height,
        ringRadius: 460,
      });
      const cx = Phaser.Math.Clamp(x, 30, this.scale.width - 30);
      const cy = Phaser.Math.Clamp(y, 30, this.scale.height - 30);
      const enemy = new Enemy(this, { kind, x: cx, y: cy });
      this.enemies.push(enemy);
      this.enemyGroup.add(enemy.sprite);
      if (ENEMY_DEFS[kind].boss) {
        this.bossActive = true;
        playSfx("bossWarn");
        playTrack("boss");
      }
    }
  }

  _updateEnemies(deltaMs) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.alive) {
        e.destroy();
        this.enemies.splice(i, 1);
        continue;
      }
      e.update(deltaMs, this.player.x, this.player.y);
    }
  }

  _autoAttack(tMs) {
    const result = planVolley({
      tMs,
      lastShotMs: this.lastShotMs,
      player: {
        x: this.player.x,
        y: this.player.y,
        attackRange: this.player.attackRange,
        attackInterval: this.player.attackInterval,
        projectilesPerVolley: this.player.projectilesPerVolley,
      },
      enemies: this.enemies
        .filter((e) => e.alive)
        .map((e) => ({ x: e.x, y: e.y, _ref: e })),
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
        x: this.player.x,
        y: this.player.y,
        dirX: dx / d,
        dirY: dy / d,
        speed: this.player.projectileSpeed,
        damage: this.player.attackDamage,
        pierce: this.player.projectilePierce,
        ttlMs: 1100,
      });
    }
  }

  _updateProjectiles(deltaMs) {
    const { width, height } = this.scale;
    for (const p of this.projectiles) {
      if (!p.active) continue;
      p.update(deltaMs);
      if (
        p.sprite.x < -20 ||
        p.sprite.x > width + 20 ||
        p.sprite.y < -20 ||
        p.sprite.y > height + 20
      ) {
        p.kill();
      }
    }
  }

  _updateGems(deltaMs) {
    for (const g of this.gems) {
      if (!g.active) continue;
      g.update(deltaMs, this.player);
    }
  }

  _maybeBossWarn(tMs) {
    const wave = currentWave(tMs);
    if (wave.oneShot && this.lastBossWarnAt !== wave.fromMs) {
      this.lastBossWarnAt = wave.fromMs;
      this._floatingText(
        "⚠ BOSS ⚠",
        this.scale.width / 2,
        this.scale.height * 0.35,
        PALETTE.blood,
        40,
      );
    }
  }

  _onEnemyKill(enemy) {
    this.killCount += 1;
    const def = enemy.def;
    const goldDrop = Math.max(
      1,
      Math.round(def.gold * this.player.goldMultiplier),
    );
    this.goldEarned += goldDrop;
    this._spawnGem(
      enemy.x,
      enemy.y,
      def.xp,
      def.boss ? "large" : def.hp >= 20 ? "medium" : "small",
    );
    if (def.hatchesInto) {
      for (let i = 0; i < (def.hatchCount ?? 1); i++) {
        const baby = new Enemy(this, {
          kind: def.hatchesInto,
          x: enemy.x + (i ? 18 : -18),
          y: enemy.y,
        });
        this.enemies.push(baby);
        this.enemyGroup.add(baby.sprite);
      }
    }
    if (def.boss) {
      this.bossActive = false;
      playTrack("dungeon");
      if (
        def === ENEMY_DEFS.boss &&
        this.time.now - this.runStartMs >= 580_000
      ) {
        this._victoryFired = true;
        this._endRun(this.time.now - this.runStartMs, true);
      }
    }
  }

  _spawnGem(x, y, value, size = "small") {
    const gem = this.gems.find((g) => !g.active);
    if (!gem) return;
    gem.reset({ x, y, value, size });
  }

  _collectGem(gem) {
    const gain = gem.value;
    gem.kill();
    playSfx("gem");
    const next = applyXpGain(
      { level: this.player.level, xp: this.player.xp },
      gain,
    );
    this.player.level = next.level;
    this.player.xp = next.xp;
    if (next.levelUps > 0) {
      playSfx("levelUp");
      this._floatingText(
        "LEVEL UP!",
        this.player.x,
        this.player.y - 60,
        PALETTE.goldBright,
        24,
      );
      for (let i = 0; i < next.levelUps; i++) this._presentLevelUp();
    }
  }

  _presentLevelUp() {
    this.scene.pause();
    this.scene.launch("LevelUp", {
      excludeIds: this.player.takenPassives,
      onPick: (passiveId) => {
        applyPassive(this.player, passiveId);
        this.scene.stop("LevelUp");
        this.scene.resume();
      },
    });
  }

  _floatingText(text, x, y, color, fontSize) {
    const t = this.add
      .text(x, y, text, {
        fontFamily: "monospace",
        fontSize: `${fontSize}px`,
        color: "#" + color.toString(16).padStart(6, "0"),
        stroke: "#0a1230",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: t,
      y: y - 50,
      alpha: 0,
      duration: 900,
      ease: "Sine.out",
      onComplete: () => t.destroy(),
    });
  }

  _screenShake(durationMs, mode) {
    const intensity = mode === "high" ? 0.012 : mode === "off" ? 0 : 0.005;
    this.cameras.main.shake(durationMs, intensity);
  }

  _togglePause() {
    if (this.paused) return;
    this.scene.pause();
    this.scene.launch("Pause", { from: "Game" });
  }

  _debugLevelUp() {
    this._collectGem({ value: 999, kill: () => {} });
  }

  _endRun(timeMs, victory = false) {
    stopTrack();
    playSfx("death");
    // Bank gold + records
    const save = updateSave((s) => {
      s.gold = (s.gold ?? 0) + this.goldEarned;
      s.records.totalRuns += 1;
      if (timeMs > s.records.bestTimeMs) s.records.bestTimeMs = timeMs;
      if (this.killCount > s.records.bestKills)
        s.records.bestKills = this.killCount;
      return s;
    });
    this.registry.set("save", save);
    this.scene.stop("HUD");
    this.scene.start("GameOver", {
      victory,
      timeMs,
      kills: this.killCount,
      gold: this.goldEarned,
      newBest: timeMs >= save.records.bestTimeMs && timeMs > 0,
    });
  }
}
