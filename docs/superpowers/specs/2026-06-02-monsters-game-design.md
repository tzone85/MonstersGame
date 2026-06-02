# MonstersGame — Production Design Spec

**Date:** 2026-06-02
**Status:** Approved by goal directive (`/goal` 2026-06-02).
**Authors:** Thando Mini, Claude.

## 1. Goal

Turn the existing point-and-click bull demo into a production-ready,
browser-based monster survivor-roguelite with a Final-Fantasy-inspired
aesthetic, full audio, an in-game tutorial, and a retention loop.

Success criteria:

- Runs in any evergreen browser at a stable 60fps on a 5-year-old laptop.
- First-time players reach their first level-up choice without external help.
- A run lasts 5–10 minutes; meta-progression persists across runs.
- All required assets are bundled — no runtime CDN fetches.
- CI is green: lint, unit (≥80% on pure modules), Playwright smoke, build.
- Deployed to GitHub Pages from `main`.

## 2. Genre, Loop, and Why

**Genre:** top-down action survivor-roguelite (Vampire Survivors / Magic
Survival lineage), reskinned with FF-flavour UI and monster-tamer fiction.

Choice rationale, briefly:

- **Preserves the existing input mechanic.** Click/touch to move maps
  directly to the existing collision-resolving steering.
- **Retention by construction.** Short runs, meta-currency, unlock tree, and
  daily/seed challenges are the genre's core verbs.
- **Fits the existing art.** Bull → hero. Toads/larva/egg → enemy variants.
  Obstacles → destructible scenery.
- **Single-player, offline-capable, no backend.** Cuts production scope.

### Core loop (per run)

`Spawn → wave begins → auto-attack nearest enemy → enemies drop XP gems →
fill XP bar → level up → choose 1 of 3 passive upgrades → continue → die or
beat boss → score screen → bank gold → return to title.`

### Meta loop

`Run gold → Shop purchases (new heroes, starting passives, perks) → next run
starts stronger → harder waves accessible.`

### Win/lose

- **Lose:** player HP reaches 0.
- **Win:** survive 10 minutes and defeat the final boss wave.

## 3. Stack

| Concern              | Choice                                     | Why                                                                 |
|----------------------|--------------------------------------------|---------------------------------------------------------------------|
| Game framework       | **Phaser 3** (`phaser@^3.80`)              | Scenes, audio, tween, input, particles, pipelines, mature ecosystem |
| Build                | Vite (existing)                            | Already wired; ES modules; fast HMR                                 |
| Language             | JavaScript (existing) + JSDoc types        | Avoids TS migration tax for a small team; types where it pays off   |
| Audio                | Vanilla WebAudio synth                     | Zero external deps, fully bundled, FF-style chiptune feasible       |
| Validation           | Zod                                        | Save-data schema enforcement at the localStorage boundary           |
| State                | Plain modules + Phaser data-manager        | No global store needed at this size                                 |
| Tests (unit)         | Vitest (existing) + happy-dom              | Already wired                                                       |
| Tests (e2e)          | Playwright (existing)                      | Already wired                                                       |
| Lint                 | ESLint flat config (existing)              | Already wired                                                       |
| CI                   | GitHub Actions (existing)                  | Extend with deploy job                                              |
| Deploy               | GitHub Pages                               | Free, static, fits Vite output                                      |

**Explicitly rejected:** TypeScript migration (cost > benefit at this size),
PixiJS (loses scene/audio/input batteries-included), Godot/Defold (browser
export is heavier), npm audio libs (Tone.js et al — increase bundle, not
needed for the chiptune palette we want).

## 4. Architecture

Phaser-scene-driven, with stateless systems for gameplay and a thin save
layer at the persistence boundary.

```
┌────────────────────────────────────────────────────────────────────┐
│                            main.js                                 │
│                  (Phaser.Game config + scene reg)                  │
└─────────────────────────────────┬──────────────────────────────────┘
                                  │
   ┌──────────────────────────────┼──────────────────────────────┐
   │                              │                              │
┌──┴───┐  ┌────────┐  ┌────────┐  ┌──────┐  ┌─────┐  ┌────────┐  ┌────────┐
│ Boot │→ │ Title  │→ │ Tutor- │→ │ Game │→ │ HUD │  │ Pause  │  │ GameO. │
└──────┘  └────────┘  │  ial   │  └──────┘  └─────┘  └────────┘  └────────┘
              │       └────────┘     │                              │
              ↓                      │                              ↓
          ┌────────┐                 ↓                          ┌────────┐
          │  Shop  │              ┌──────┐                      │Settings│
          └────────┘              │ Lvl  │                      └────────┘
                                  │  Up  │
                                  └──────┘

src/
├── main.js                       — Phaser.Game(config); registers scenes
├── main.css                      — body bg, canvas centering, pre-Phaser styles
├── config/
│   ├── game.js                   — width, height, version, palettes
│   ├── balance.js                — XP curve, wave table, passive defs, costs
│   └── flags.js                  — debug, mute, fastTutorial
├── scenes/
│   ├── BootScene.js              — preload (sprites, atlas, fonts), then → Title
│   ├── TitleScene.js             — animated title, menu, BGM start
│   ├── TutorialScene.js          — scripted overlay, runs an isolated GameScene
│   ├── GameScene.js              — main loop; spawns systems
│   ├── HUDScene.js               — XP bar, HP, score, time, gold (overlay)
│   ├── LevelUpScene.js           — pause world, present 3 passive cards
│   ├── PauseScene.js             — modal pause; resume/quit
│   ├── GameOverScene.js          — results, gold-banked, retry/title
│   ├── ShopScene.js              — meta-progression unlocks
│   └── SettingsScene.js          — volume sliders, key remap, accessibility
├── systems/
│   ├── waveSpawner.js            — pure: time → enemies-to-spawn-this-tick
│   ├── autoAttack.js             — pure: state → projectile spawn intents
│   ├── xpCurve.js                — pure: level → xp-required
│   ├── passives.js               — pure: passive registry + apply()
│   ├── collision.js              — kept verbatim from existing code
│   └── steering.js               — kept verbatim (extracted from existing player)
├── entities/
│   ├── Player.js                 — Phaser sprite + state; subscribes to passives
│   ├── Enemy.js                  — Phaser sprite + AI variants
│   ├── Projectile.js             — Phaser sprite + lifetime + hit logic
│   └── Gem.js                    — Phaser sprite + magnet behavior
├── ui/
│   ├── FFFrame.js                — 9-slice dialog frame (blue + gold)
│   ├── Typewriter.js             — character-by-character text reveal
│   ├── PassiveCard.js            — FF-style upgrade card with icon/desc
│   └── Button.js                 — bitmap-font button w/ hover sfx
├── audio/
│   ├── SynthEngine.js            — WebAudio wrapper; envelope, channels, mix bus
│   ├── tracks.js                 — note-sequence data (title, dungeon, boss)
│   └── sfx.js                    — short sequences (hit, gem, level, death, ui)
└── save/
    ├── schema.js                 — Zod schema for SaveData v1
    ├── storage.js                — load/save/migrate against localStorage
    └── unlocks.js                — pure: derive unlocked content from save
```

### Sizing rules

- Files target 200–400 lines; 800 max. If a scene or system exceeds 400
  lines during implementation, extract a helper module.
- Pure systems (no Phaser, no DOM) live under `src/systems/` so they can be
  unit-tested headlessly. The existing collision tests survive verbatim.

## 5. Data flow

```
input (mouse / touch / key)
        │
        ▼
   GameScene.update(dt)
        │
        ├──→ steering(player, mouse) → desired velocity
        │        ↓
        │   collision(player, obstacles) → corrected position
        │
        ├──→ waveSpawner(t) → enemy spawn intents → Enemy entities
        │
        ├──→ autoAttack(player, enemies) → projectile intents → Projectile entities
        │
        ├──→ Projectile↔Enemy overlaps → damage, kill, drop Gem
        │
        ├──→ Player↔Gem overlap → xp += gem.value
        │        ↓
        │    xpCurve(level) ≤ xp → levelUp event → LevelUpScene
        │
        ├──→ Enemy↔Player overlap → player HP -= dmg
        │
        └──→ HUDScene reads scoped state via Phaser events
                 ↓
              renders HP / XP / time / score / gold

   on player.hp ≤ 0 → GameOverScene → save.bankGold() → Title
```

## 6. Scenes — detail

### 6.1 BootScene
- Loads sprite atlases (re-uses existing PNGs in `public/`), bitmap font,
  and an in-code-generated 1×1 white texture.
- Initializes audio engine (resume on first user gesture).
- Loads + migrates save data; defaults if missing.
- Transitions to `TitleScene`.

### 6.2 TitleScene
- Parallax background (existing `background.png`, tinted).
- Animated title sprite (typewriter on the subtitle).
- Menu: **New Run**, **Tutorial**, **Shop**, **Settings**, **Credits**.
- Starts title BGM, fades when leaving.

### 6.3 TutorialScene
- Hosts a stripped `GameScene` with scripted state.
- Stages, each gated by a player action:
  1. "Click anywhere to move." → wait for first move.
  2. "You attack automatically. Try staying near this slime." →
     spawn one weak enemy; wait for kill.
  3. "Collect the gem." → wait for gem pickup.
  4. "Fill the bar to level up." → guarantee a level-up; show passive picker.
  5. "Defeat the wave to win the tutorial." → spawn small wave.
- Skippable from menu. Replayable from Title.
- Overlay arrows + FF-style dialog frames (`ui/FFFrame.js`).

### 6.4 GameScene
- Owns world: player, enemies, projectiles, gems, obstacles.
- Owns timers: wave clock, boss clock, run clock.
- Emits domain events: `xp:gain`, `level:up`, `enemy:kill`, `player:hit`,
  `run:end` for HUD/Audio subscribers.

### 6.5 HUDScene
- Overlay scene running atop `GameScene`.
- Components: HP bar (FF blue gradient), XP bar (gold), wave timer (mm:ss),
  run gold tally, kill count, current level.

### 6.6 LevelUpScene
- Pauses physics on `GameScene`; renders 3 `PassiveCard`s.
- Picks 3 from the passive pool weighted by rarity (`config/balance.js`).
- On select → apply to player → resume.

### 6.7 PauseScene
- ESC or pause button → semi-transparent overlay → Resume / Settings / Quit.

### 6.8 GameOverScene
- Stats: time survived, kills, gems, gold earned, new best?
- Buttons: **Retry**, **Title**.
- Banks gold to save before navigation.

### 6.9 ShopScene
- Tabs: **Heroes**, **Starting Passives**, **Perks**.
- Each item: cost in gold, locked/unlocked state, description.
- Persists purchase to save (idempotent — re-buying an unlocked item is a no-op).

### 6.10 SettingsScene
- Master / BGM / SFX volume sliders.
- Color-blind palette toggle (swaps red/blue gem variants).
- Screen-shake intensity (0/low/high).
- Mouse / keyboard input mode hint.

## 7. Entities

### 7.1 Player
- Sprite from `bull.png` (8-direction, existing 8-row strip).
- Stats: HP, moveSpeed, attackInterval, attackDamage, projectileSpeed,
  pickupRadius, level, xp, gold.
- Mutated **only** through `applyPassive(passiveId)` — keeps the level-up
  flow auditable.

### 7.2 Enemy
- Variants: `toad` (chaser), `larva` (slow tank), `egg` (spawner — hatches on
  death into two larvas), `boss` (large toad — appears at 5:00 and 10:00).
- AI: simple seek-player vector; bosses telegraph + dash.

### 7.3 Projectile
- Spawned by `autoAttack` system.
- Lifetime in ms; despawns on hit or expiry.
- Pooled (Phaser group) — no per-frame allocation in steady state.

### 7.4 Gem
- Small/medium/large by enemy class.
- Magnet behavior once within `player.pickupRadius`.

## 8. Audio

### 8.1 Engine
- Single `AudioContext` lazily resumed on first user gesture (Chrome policy).
- Mix buses: **master**, **bgm**, **sfx** with independent gain nodes.
- Volumes read from save; persisted via Settings.

### 8.2 Music
- 3 tracks, hand-sequenced as note arrays:
  - **Title** — slow arpeggio in D minor, FF-overworld cadence.
  - **Dungeon** — driving 8th-note bass + lead, escalates intensity with
    wave number (filter cutoff opens).
  - **Boss** — minor key, syncopated, fast.
- Implemented as scheduler that pushes notes to `OscillatorNode` chains
  with envelopes; loops on `currentTime + bar`.

### 8.3 SFX
- `hit`, `gemPickup`, `levelUp`, `playerHit`, `death`, `uiHover`, `uiSelect`.
- Each is a tiny note sequence with envelope + filter.
- All synthesized — no audio files in the bundle.

### 8.4 Accessibility
- All audio respects the master/bgm/sfx volumes.
- Settings includes a "mute all" toggle (saved).

## 9. Save data

```ts
// schema.js (JSDoc; runtime via Zod)
SaveData v1 = {
  version: 1,
  gold: number,
  unlocks: {
    heroes: string[],          // e.g. ["bull"]
    startingPassives: string[],
    perks: string[]
  },
  settings: {
    masterVolume: 0..1,
    bgmVolume:    0..1,
    sfxVolume:    0..1,
    screenShake:  "off" | "low" | "high",
    palette:      "default" | "colorblind"
  },
  records: {
    bestTimeMs: number,
    bestKills:  number,
    totalRuns:  number
  }
}
```

- Validated with Zod on every load. Invalid blobs are quarantined to
  `monstersgame.save.invalid.<timestamp>` and a fresh default save is created.
- Versioned migration (`migrate(v0)`, `migrate(v1)`, …) keeps room to evolve.

## 10. Visual direction — FF-flavour, briefly

- **Palette:** deep navy (`#0a1230`) + warm gold (`#e7c66a`) + parchment
  (`#f0e2bc`) for UI. Sprites kept untouched on gameplay layer.
- **UI chrome:** 9-slice FF-style frames, rounded but pixel-perfect; gold
  border, navy fill, parchment text.
- **Typography:** bitmap font from a public-domain source; fall back to
  system-monospace via Phaser BitmapText.
- **Effects:**
  - Particle burst on level-up (gold) and on enemy kill (smoke).
  - Screen shake on player hit (intensity from settings).
  - Vignette + slight bloom via a single Phaser pipeline.
  - Parallax background — two layers from existing `background.png`.
- **Dialog:** typewriter reveal with 'ding' SFX per chunk; press any key to fast-forward.

## 11. Performance budget

- 60fps on a 2019 MacBook Air at 1280×720.
- Pool projectiles, enemies, gems — no allocation in `update()`.
- Cap concurrent on-screen enemies at 120; queued spawns wait.
- Bundle ≤ 600 KB gzipped (Phaser ≈ 350 KB minified-gzip; rest is ours).
- Lighthouse production check: Performance ≥ 90, Best Practices ≥ 90.

## 12. Testing

| Layer       | Tool       | Targets                                                       |
|-------------|------------|---------------------------------------------------------------|
| Unit (pure) | Vitest     | `collision`, `xpCurve`, `waveSpawner`, `passives`, `save/*`   |
| Component   | Vitest     | `SynthEngine` schedule math; `FFFrame` 9-slice math           |
| E2E smoke   | Playwright | Title loads → click "New Run" → canvas animates → gameover    |
| Coverage    | v8         | ≥85% lines / ≥80% branches on `src/systems/**` and `src/save/**` |

Existing `collision.test.js` keeps passing without modification — the math
module is preserved verbatim.

## 13. Production wiring

- **Deploy:** `gh-pages` job in `.github/workflows/ci.yml` triggered on
  `push` to `main`, after lint/unit/e2e/build all pass.
- **Static SEO:** `<title>`, meta description, `og:image` (a 1200×630
  screenshot of Title), favicon (small bull crop).
- **Error reporting:** an in-browser error boundary; logs to console.
  No external service unless one is configured via env.
- **Analytics:** opt-in only, off by default. Not in v1.
- **README:** rewritten with controls, run anatomy, dev workflow, deploy
  instructions, screenshots, license, credits.

## 14. Out of scope (v1)

- Multiplayer / leaderboards backed by a server.
- Story mode beyond the tutorial fiction.
- Mobile-app wrapping (Capacitor / PWA install banner — possible v1.1).
- Localization beyond English strings.
- In-game purchases.

## 15. Risks and mitigations

| Risk                                           | Mitigation                                                              |
|------------------------------------------------|-------------------------------------------------------------------------|
| Phaser bundle pushes load time too long        | Code-split title/loader; show splash from `index.html`                  |
| WebAudio music sounds harsh / fatiguing        | Hand-tune envelopes; soft filter cutoff; A/B in playtest                |
| 8-direction sprite from `bull.png` mis-frames  | Reuse existing `angleToFrameY` (already debugged + tested)              |
| Save data corruption breaks load               | Zod validation + quarantine + default reset (§9)                        |
| Stop-hook goal blocks completion               | Linear execution against the task list; each task is independently verifiable |

## 16. Open decisions deferred to implementation

- Final note sequences for music (creative pass; iterate to taste).
- Exact wave-table numbers (balanced via quick play sessions during dev).
- Specific passive set (start with 8; expand if time allows).
