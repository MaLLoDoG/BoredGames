# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Non-Obvious Coding Rules

### `import type` is mandatory — build will fail otherwise
`verbatimModuleSyntax: true` in tsconfig means any type-only import that uses plain `import`
instead of `import type` causes a hard TypeScript error. The build script runs `tsc -b` before
Vite, so the bundle never produces if types are imported wrong.

### No test npm script — vitest must be called directly
```bash
npx vitest run src/games/farkle/engine.test.ts   # single file
npx vitest run                                    # all tests
```
`npm test` does not exist in package.json.

### Lint is oxlint, not eslint
`npm run lint` calls `oxlint`. Do not install or reference eslint.

### Unused variables are build errors
`noUnusedLocals` and `noUnusedParameters` are enabled. Any unused import or variable
breaks `npm run build`. Use `void x` to explicitly suppress if needed.

### Engine functions must be pure and cite RULES.md
All `engine.ts` functions must be `(state, ...args) => newState` with no mutation.
Comments must reference the relevant `RULES.md` section: `// §4 Step 3`.
Logic that belongs in the engine must NOT be placed in the hook or component.

### Wiring a new game requires two places
`available: true` in `src/types/games.ts` AND a branch in `App.tsx` (`PLAYER_COUNT_RANGE` +
screen case). Doing only one silently fails — the Play button fires but nothing happens.
