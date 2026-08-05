# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Non-Obvious Documentation Context

### RULES.md is the spec — not comments or README
Each game has `src/games/<name>/RULES.md` as the authoritative rules reference.
Engine code comments cite sections from it (e.g. `§7`, `§11`). When asked about game
rules or logic, read RULES.md first — it is more authoritative than the code.

### Game roster lives in one place
`src/types/games.ts` contains every game's metadata (`GAMES[]`) and the `GameId` union.
This is the single source of truth for what games exist, their player counts, categories,
and whether they are available. The lobby renders directly from this array.

### "Coming soon" is controlled by a single boolean
`available: false` in a game's entry in `GAMES[]` is all that gates the Play button.
There is no feature flag system, no environment variable — just that field.

### Tests are colocated, not in a separate folder
`engine.test.ts` sits next to `engine.ts` inside `src/games/<name>/`. There is no
top-level `tests/` or `__tests__/` directory.

### Tailwind v4 syntax is in use
`src/index.css` uses `@import "tailwindcss"` — v4 syntax. Any v3 documentation
(`@tailwind base` etc.) is wrong for this project.
