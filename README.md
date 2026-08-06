# BoredGames

A browser-based digital game facilitator — no AI opponents, no online multiplayer. Just rules enforcement, turn management, and a real game-board feel for people sitting together.

**Live repo:** https://github.com/MaLLoDoG/BoredGames

---

## Quick Start

```bash
npm install
npm run dev        # dev server at http://localhost:5173
```

## Commands

```bash
npm run dev        # Vite dev server, hot reload
npm run build      # tsc -b && vite build → dist/
npm test           # vitest run --reporter=verbose (all tests)
npm run lint       # oxlint
```

## Android / WebView

`npm run build` produces a `dist/` folder with relative asset paths (`./assets/...`).
Drop the entire `dist/` contents into your Android WebView wrapper's asset directory and point the WebView at `index.html`. No server required.

Ensure `WebSettings`:
```java
webSettings.setJavaScriptEnabled(true);
webSettings.setDomStorageEnabled(true);
```

---

## Playable Games

| Game | Category | Players |
|------|----------|---------|
| Farkle | Dice | 1–6 |
| Shut the Box | Dice | 1–4 |
| Yacht | Dice | 1–6 |
| Go Fish | Card | 2–6 |
| Connect Four | Board | 2 |

## Coming Soon

Checkers, Chess, Backgammon, Cribbage, Gin Rummy, Hearts, Spades, Mancala, Battleship, Jigsaw, Solitaire

---

## Tech Stack

| | |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| Styles | Tailwind CSS v4 |
| Tests | Vitest |
| Lint | oxlint |

---

## Architecture

Every game follows the same three-layer pattern:

```
RULES.md          ← plain-English spec, every § number is cited in the engine
engine.ts         ← pure functions: (state, ...args) => newState — no React, no side effects
engine.test.ts    ← tests live alongside the engine, not in a separate folder
use<Game>.ts      ← useReducer + useCallback — the only bridge between engine and React
<Game>.tsx        ← UI component, reads state, calls hook actions
rules.ts          ← player-facing plain English rules, consumed by RulesModal
components/       ← game-specific UI components
```

No AI. No network. Pass-and-play only. Card games use a `HandoffScreen` cover between turns to enforce hidden information.

---

## Test Count

297 tests passing across 5 games (as of last update).
