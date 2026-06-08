# MonstersGame — A Survivor's Tale

A browser-based action survivor-roguelite with a Final-Fantasy flavour.
Click to move. Auto-attack the swarm. Level up. Survive ten minutes.
Bank gold, unlock heroes and passives, run again.

[![CI](https://github.com/tzone85/MonstersGame/actions/workflows/ci.yml/badge.svg)](https://github.com/tzone85/MonstersGame/actions/workflows/ci.yml)
![Node 20+](https://img.shields.io/badge/node-20%2B-339933)
![Phaser 3](https://img.shields.io/badge/engine-phaser%203-3a3a3a)
![License: MIT](https://img.shields.io/badge/license-MIT-green)

## What it is now

This started as a 256-line `script.js` — point-and-click a bull around four
static obstacles. It has been rewritten end-to-end into a production-grade
survivor-roguelite while keeping the original click-to-move feel.

The current build ships:

- 10 self-contained Phaser scenes (Boot, Title, Tutorial, Game, HUD,
  LevelUp, Pause, GameOver, Shop, Settings).
- An in-game tutorial that gates the new player through the first
  click-to-move, the first kill, the first gem, the first level-up, and a
  small finishing wave.
- Synthesised WebAudio chiptune — three looping tracks (Title / Dungeon /
  Boss) plus a full SFX bank — zero audio assets in the bundle.
- A 10-minute escalating wave schedule with two boss encounters.
- 10 stackable / single-take passives picked from a weighted pool at
  level-up.
- A meta-progression shop with gold currency, alternate heroes, starting
  passives, and perks. Save data is validated with Zod and quarantined on
  corruption.
- An FF-styled HUD: navy + gold UI frames, typewriter dialog, particles,
  screen shake, vignette, parallax.

## Quick start

```bash
npm install
npm run dev        # vite dev server on :5173
npm run build      # produces dist/
npm run preview    # serves dist/ on :4173
npm test           # vitest + coverage (≥80% lines on pure modules)
npm run test:e2e   # Playwright e2e against the preview build
npm run lint
npm run diagrams   # renders docs/architecture/*.puml → *.svg (needs plantuml)
```

Open `http://localhost:5173` — first click resumes audio (browser
policy).

### Windows users

Everything above works identically in **PowerShell** and **cmd.exe** on
Windows 10/11. No POSIX shell required. Two notes:

- **Node ≥ 20.** Install from [nodejs.org](https://nodejs.org/) or via
  `winget install OpenJS.NodeJS.LTS` / `choco install nodejs-lts`.
- **PlantUML** (only if you regenerate diagrams): `choco install plantuml`
  or `scoop install plantuml`. The `npm run diagrams` script auto-detects
  the binary and prints install hints if it's missing.

The repo enforces LF line endings via `.gitattributes`, so Windows clones
won't muddle the diff with CRLF noise. If your local clone already has
CRLF files, run:

```powershell
git add --renormalize .
git commit -m "chore: normalize line endings"
```

CI runs **lint**, **unit tests**, and **build** on both `ubuntu-latest`
and `windows-latest` so platform regressions surface immediately.

### Useful URL params

| Param            | Effect                                                    |
|------------------|-----------------------------------------------------------|
| `?debug=1`       | Press **L** in-game to force a level-up.                  |
| `?fastTutorial=1`| Skip the wait-gates in the tutorial.                      |
| `?mute=1`        | Force-mute audio (useful for screenshots).                |

## How to play

| Action            | Input                                |
|-------------------|--------------------------------------|
| Move              | Click or touch where you want to go. |
| Attack            | Automatic — nearest enemy in range.  |
| Pick up gems      | Walk near them (magnet on contact).  |
| Pause             | `ESC` or `P`.                        |
| Choose passive    | Click a card at level-up.            |
| Skip dialog       | Click during the tutorial.           |

A run lasts 10 minutes. Survive until 10:00 to win. Die and your gold is
banked back to the title — spend it in the **Shop** to unlock new heroes,
starting passives, and perks for the next attempt.

## Architecture

```
src/
├── main.js                  Phaser.Game config + scene registration
├── main.css
├── config/                  Game tuning data (palette, balance, flags)
│   ├── game.js
│   ├── balance.js           XP curve, wave table, passive defs, costs
│   └── flags.js
├── scenes/                  One file per scene
│   ├── BootScene.js         Preload + splash bar
│   ├── TitleScene.js        Animated menu + BGM start
│   ├── TutorialScene.js     Scripted first-play with arrows + prompts
│   ├── GameScene.js         Core run loop
│   ├── HUDScene.js          HP/XP/time/score overlay
│   ├── LevelUpScene.js      FF-style passive picker
│   ├── PauseScene.js        Resume/Settings/Quit
│   ├── GameOverScene.js     Banks gold + records
│   ├── ShopScene.js         Heroes/passives/perks
│   └── SettingsScene.js     Volume sliders + cycler toggles
├── entities/                Phaser sprite wrappers + behaviour
│   ├── Player.js
│   ├── Enemy.js
│   ├── Projectile.js
│   └── Gem.js
├── systems/                 Pure logic (no Phaser, no DOM) — unit tested
│   ├── collision.js         Circle math (legacy module — kept verbatim)
│   ├── steering.js          Vector helpers + 8-direction mapping
│   ├── waveSpawner.js       Wave schedule + spawn-tick decisions
│   ├── autoAttack.js        Target-selection planner
│   ├── xpCurve.js           Level-up arithmetic
│   └── passives.js          Passive pool + weighted picks + apply()
├── audio/                   Hand-rolled WebAudio engine
│   ├── SynthEngine.js       Buses, envelopes, scheduler
│   ├── tracks.js            Title/Dungeon/Boss note sequences
│   ├── sfx.js               Hit/gem/level/death/UI sequences
│   └── index.js             Singleton getter + helpers
├── ui/                      Stateless visual helpers
│   ├── FFFrame.js
│   ├── Typewriter.js
│   ├── Button.js
│   └── PassiveCard.js
└── save/                    Zod-validated localStorage layer
    ├── schema.js
    ├── storage.js
    └── unlocks.js
```

The original `collision.js` lives unchanged inside `src/systems/`; its
bug-regression test still passes. Everything in `src/systems/` and
`src/save/` is unit-tested.

### Component sketch

```
            ┌────────────┐
            │ Boot       │ preload, audio init, save load
            └─────┬──────┘
                  ▼
            ┌────────────┐
            │ Title      │ — Shop / Settings / Tutorial / Credits
            └────┬───────┘
                 ▼ "New Run"
            ┌────────────┐    pause   ┌──────────┐
            │ Game       │ ◀────────▶ │ LevelUp  │
            └─┬──────────┘            └──────────┘
              │ overlay
              ▼
            ┌────────────┐
            │ HUD        │
            └────────────┘
```

## Tests

| Suite                                  | Cases | Surface                                 |
|----------------------------------------|-------|-----------------------------------------|
| `tests/unit/collision.test.js`         | 26    | Circle math + frame-direction mapping   |
| `tests/unit/steering.test.js`          | 3     | Steering + angle re-export              |
| `tests/unit/xpCurve.test.js`           | 6     | Curve monotonicity + multi-level gain   |
| `tests/unit/waveSpawner.test.js`       | 7     | Wave schedule + spawn-tick decisions    |
| `tests/unit/autoAttack.test.js`        | 5     | Target selection + cooldown             |
| `tests/unit/passives.test.js`          | 6     | Pool weights + apply() invariants       |
| `tests/unit/save.test.js`              | 9     | Schema, persistence, quarantine, shop   |
| `tests/unit/unlocks.test.js`           | 8     | Hero/passive/perk purchase paths        |
| `tests/unit/synthEngine.test.js`       | 11    | Mocked AudioContext exercises engine    |
| `tests/e2e/canvas-smoke.spec.js`       | 2     | Title renders + run starts in browser   |
| **Total**                              | **90**| 92%+ lines on systems/save/audio        |

```bash
npm test          # vitest --coverage
npm run test:e2e  # playwright vs preview
```

## CI

`.github/workflows/ci.yml` runs:

1. **lint** — `eslint .`
2. **unit** — `vitest --coverage` (gated at 80% lines)
3. **e2e** — `playwright test` against `vite preview`
4. **build** — `vite build`
5. **deploy** — `gh-pages` (production-only, on push to `main`)

Playwright reports + coverage HTML are uploaded as artifacts.

## Deploy

The production build is a static `dist/`. CI publishes it to GitHub Pages
from the `main` branch. Anywhere that serves static files works (Netlify,
Vercel, S3 + CloudFront, your own nginx).

```bash
npm run build
# upload dist/
```

## Performance

- Phaser 3 + Arcade physics. ~346 KB gzipped.
- Object pools for projectiles (80), gems (200), enemies (cap 140).
- Synthesised audio — no audio files in the bundle.
- 1280×720 fit-scaled to the viewport with `Phaser.Scale.FIT`.
- Targets 60fps on a 5-year-old laptop.

## Project history

The original implementation, the 256-line single-file demo, and the
`game/` extraction with the click-to-move bull are preserved in the git
history. The 2026-06-02 production rewrite spec lives at
[`docs/design.md`](docs/design.md).

## License

MIT — see [LICENSE](LICENSE).
