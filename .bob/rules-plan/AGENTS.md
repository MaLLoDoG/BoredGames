# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Non-Obvious Architectural Constraints

### Three-layer architecture is mandatory for every game
```
engine.ts       pure functions (state) => newState, no React, no side effects
use<Game>.ts    useReducer + useCallback only — zero logic, just dispatch wiring
<Game>.tsx      reads state + calls hook actions — zero game logic
```
Breaking this layering (e.g. putting scoring logic in a component) violates the pattern
all future games are expected to follow.

### App.tsx is the only navigation controller
There is no router library. `App.tsx` holds an `AppView` discriminated union and renders
the correct screen. Adding a new game requires adding a new union member and a render branch
here. The lobby, setup screen, and game screens are all siblings under this one controller.

### Player setup screen is generic but wiring is per-game
`PlayerSetup` in `App.tsx` is reused across games. `PLAYER_COUNT_RANGE` controls the
min/max slider per game. The `onStart` callback must explicitly route to the correct game
screen — there is no automatic dispatch by `GameId`.

### Engine state is immutable by convention, not enforcement
TypeScript does not freeze state objects. All engine functions must return new objects.
Mutating state in-place will produce silent bugs since `useReducer` checks reference equality.

### Lobby `available` flag gates two things simultaneously
Setting `available: true` without adding the game's wiring in `App.tsx` produces a broken
Play button (navigates to setup but "Start Game" goes back to lobby). Both changes are always
required together — treat them as an atomic unit.

### No backend, no persistence
All game state is in-memory React state. Refreshing the page loses the game. No localStorage,
no server. This is intentional — pass-and-play only for now.
