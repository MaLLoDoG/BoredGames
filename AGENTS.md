# AGENTS.md

Guidance for AI agents working in this repository.

---

## Commands

```bash
npm run dev                          # dev server at localhost:5173
npm run build                        # tsc -b && vite build (TypeScript errors = build failure)
npm test                             # vitest run --reporter=verbose — run ALL tests
npx vitest run src/games/farkle/engine.test.ts  # run a single test file
npm run lint                         # oxlint (not eslint)
```

`npm test` is the canonical test command. Always run it before committing.

---

## Repository Structure

```
src/
  App.tsx                        # Navigation shell: lobby → setup → game
  index.css                      # @import "tailwindcss" (Tailwind v4)
  types/
    games.ts                     # GameId union + GAMES[] — single source of truth for lobby
    rules.ts                     # RulesSection / GameRules interfaces
    gameRules.ts                 # Registry: GameId → GameRules (import all rules.ts files here)
  components/
    Lobby.tsx                    # Game grid, category filters, rules modal wiring
    GameCard.tsx                 # Individual game card — accepts onRules? prop
    RulesModal.tsx               # Shared modal — takes GameRules, renders sections + bullets
  games/
    farkle/
      RULES.md                   # Dev-spec (§ numbers cited in engine)
      engine.ts                  # Pure logic
      engine.test.ts             # 104 tests
      useFarkle.ts               # useReducer hook
      Farkle.tsx
      rules.ts                   # Player-facing plain English rules
      sounds.ts                  # ← SHARED: Web Audio API sounds, imported by other games
      components/
        GameLog.tsx              # ← SHARED: auto-scrolling log, imported by other games
        PlayerTransition.tsx     # ← SHARED: turn-handoff overlay for dice games
        Die.tsx, DiceRoller.tsx, ScoreBoard.tsx, ActionBar.tsx
    shut-the-box/                # 41 tests
    connect-four/                # 40 tests
    go-fish/                     # 53 tests
    yacht/                       # 59 tests
```

---

## Critical Patterns

### Adding a new game — checklist
1. Add `GameId` to the union in `src/types/games.ts`
2. Add a `GameDefinition` entry to `GAMES[]` with `available: false`
3. Write `RULES.md` → `engine.ts` → `engine.test.ts` (tests must pass before UI)
4. Write `use<Name>.ts` (useReducer + useCallback only — no logic)
5. Write `<Name>.tsx` and `components/`
6. Write `rules.ts` (player-facing plain English — used by RulesModal)
7. Register `rules.ts` in `src/types/gameRules.ts`
8. Add `[min, max]` to `PLAYER_COUNT_RANGE` in `App.tsx`
9. Add screen branch to `AppView` union, `onStart` switch, and render block in `App.tsx`
10. Flip `available: true` in `GAMES[]` — do this last, after everything is wired

Steps 9 and 10 are BOTH required. Doing only one silently half-works.

### TypeScript strictness — build-time errors
- `verbatimModuleSyntax: true` — type-only imports **must** use `import type`
- `noUnusedLocals` and `noUnusedParameters` are **errors**, not warnings
- `erasableSyntaxOnly: true` — no `const enum`, no `namespace`
- Build runs `tsc -b` first; TypeScript errors block the Vite bundle step

### Tailwind v4
- Loaded via `@tailwindcss/vite` plugin — **no PostCSS config, no `tailwind.config.*`**
- CSS entry uses `@import "tailwindcss"` (v4 syntax)
- Responsive prefixes: `sm:` 640px, `md:` 768px, `lg:` 1024px

### Engine pattern (mandatory)
- All engine functions: `(state, ...args) => newState` — pure, no mutation, no React
- Every function must cite its `RULES.md` section (e.g. `// §4 Step 3`)
- `use<Game>.ts` contains **only** `useReducer` + `useCallback` wrappers — no game logic
- Tests live in `engine.test.ts` alongside the engine, not in a separate folder

### UI layout — mobile-first (mandatory)
- All game screens use `min-h-screen flex flex-col` as the root — **never `h-screen overflow-hidden`**
- Mobile is the default (no prefix); tablet/desktop layout overrides use `md:` or `lg:` prefixes
- Example two-column layout: `flex flex-col gap-4 md:flex-row` — stacked on mobile, side-by-side on md+
- The `GameLog` component auto-scrolls its own content — wrap it in `overflow-hidden` with a
  fixed height if it must not drive page scroll (e.g. `<div className="h-36 overflow-hidden">`)
- Never lock the page with `overflow-hidden` on the root element

### Pass-and-play hidden information (card games)
- Use `HandoffScreen` (`src/games/go-fish/components/HandoffScreen.tsx`) as the cover screen
  between turns — full-screen overlay until the active player taps "I'm Ready"
- Engine phase for this is `'handoff'` → tap ready → `'ask'` (or equivalent active phase)
- Never show another player's hand outside their own turn

### Shared components — import from farkle
These live under `src/games/farkle/` but are reused across games:
- `GameLog` — `import GameLog from '../farkle/components/GameLog'`
- `PlayerTransition` — turn-handoff overlay with bounce animation and player colors
- `sounds.ts` — `playDiceRoll`, `playBank`, `playFarkle`, `playNextPlayer`, `playWinner`
  - Sounds fire on **state phase transitions**, not on button press
  - Use a `prevPhase` ref to guard against firing on mount or unrelated re-renders:
    ```ts
    const prevSoundPhase = useRef('')
    useEffect(() => {
      const prev = prevSoundPhase.current
      prevSoundPhase.current = state.phase
      if (state.phase === prev) return
      if (state.phase === 'select') playDiceRoll()
    }, [state.phase])
    ```

### Lobby rules button
- `GameCard` accepts an optional `onRules?: (id) => void` prop
- `Lobby` owns the modal state; it passes `onRules` only when `GAME_RULES[game.id]` exists
- "Coming soon" games automatically show no `?` button

### Player quit pattern (Farkle reference implementation)
- Quitting players are marked `quit: true` in `state.players` — **never removed from the array**
- `winByForfeit: boolean` on state — set `true` when win is by forfeit, not score
- Game-over screen shows all players including quitters (struck-through with 🚪 icon)
- Multi-player quit: skip quitters when advancing turn; use `players.filter(p => !p.quit)`

### Vite base path
- `vite.config.ts` sets `base: './'` — asset paths are relative, not absolute
- Required for Android WebView (`file://`) and any non-root-path deployment

---

## Lobby `available` flag

| Value | Effect |
|-------|--------|
| `false` | "Coming soon" badge, Play button disabled, no `?` rules button |
| `true` | Play button active — game **must** also be wired in `App.tsx` or clicking silently fails |
