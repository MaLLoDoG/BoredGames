# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Commands

```bash
npm run dev          # dev server at localhost:5173
npm run build        # tsc -b && vite build (TypeScript errors = build failure)
npm run lint         # oxlint (not eslint)
npx vitest run <file>  # run a single test file — no npm script; must call vitest directly
npx vitest run src/games/farkle/engine.test.ts  # example: run Farkle tests only
```

There is **no `test` script** in package.json — always use `npx vitest run`.

## Architecture

```
src/
  types/games.ts          # GameId union + GAMES[] array — single source of truth for lobby
  components/             # Lobby-level components (Lobby, GameCard)
  games/<name>/
    RULES.md              # Authoritative rules spec — every engine function cites a §
    engine.ts             # Pure logic, zero React, zero side effects
    engine.test.ts        # Tests live alongside engine, not in a separate folder
    use<Name>.ts          # useReducer hook — only bridge between engine and React
    <Name>.tsx            # Top-level game component
    components/           # Game-specific UI components
  App.tsx                 # Navigation shell: lobby → setup → game
```

## Critical Patterns

### Adding a new game
1. Add `GameId` to the union in `src/types/games.ts`
2. Add a `GameDefinition` entry to `GAMES[]` with `available: false`
3. Build the game under `src/games/<id>/` following the engine → hook → UI layering
4. Add `[min, max]` to `PLAYER_COUNT_RANGE` in `App.tsx` and a screen branch
5. Flip `available: true` in `GAMES[]` to enable the Play button in the lobby

### TypeScript strictness — non-obvious gotchas
- `verbatimModuleSyntax: true` — type-only imports **must** use `import type`, not `import`
- `noUnusedLocals` and `noUnusedParameters` are **errors at build time** (not just warnings)
- `erasableSyntaxOnly: true` — no `const enum`, no `namespace`
- Build runs `tsc -b` first; TypeScript errors block the Vite bundle step

### Tailwind v4 — not v3
- Tailwind is loaded via `@tailwindcss/vite` plugin, **not** a PostCSS config
- CSS entry is `@import "tailwindcss"` (v4 syntax), not `@tailwind base/components/utilities`
- No `tailwind.config.*` file — configuration is in CSS if needed

### Engine pattern (mandatory for all games)
- `engine.ts` must be pure functions: `(state, ...args) => newState` — no mutation, no React
- Every function comment must cite the relevant `RULES.md` section number (e.g. `// §4 Step 3`)
- `use<Game>.ts` wraps the engine with `useReducer` + `useCallback` — no logic lives in hooks
- Game tests go in `engine.test.ts` in the same directory, not a top-level `__tests__` folder

### Lobby `available` flag
- `available: false` → "Coming soon" badge, Play button disabled
- `available: true` → Play button active; game **must** also be wired in `App.tsx` or clicking does nothing
