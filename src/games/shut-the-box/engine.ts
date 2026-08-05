/**
 * Shut the Box Engine — pure logic, zero React, zero side-effects.
 * Every function maps back to a numbered section in RULES.md.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type DieValue = 1 | 2 | 3 | 4 | 5 | 6
export type TileNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export type TurnPhase =
  | 'roll'        // waiting for player to roll
  | 'choose'      // dice rolled, player must pick tiles
  | 'bust'        // no valid combination — turn over
  | 'shut'        // all tiles closed — turn over (score 0)
  | 'game-over'   // all players have gone

export interface PlayerResult {
  id: number
  name: string
  score: number | null   // null = not yet played
  tiles: boolean[]       // true = open, index 0 = unused, 1-9 = tile state
}

export interface ShutTheBoxState {
  players: PlayerResult[]
  currentPlayerIndex: number
  dice: DieValue[]          // current roll (1 or 2 dice)
  diceTotal: number
  phase: TurnPhase
  selectedTiles: TileNumber[]   // tiles player has clicked to flip
  canUseSingleDie: boolean      // §8 — sum of open tiles ≤ 6
  log: string[]
  winner: number[] | null       // indices (multiple on tie)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rollDie(): DieValue {
  return (Math.floor(Math.random() * 6) + 1) as DieValue
}

/** §11 — enumerate all subsets of open tiles that sum to target */
export function validCombinations(openTiles: TileNumber[], target: number): TileNumber[][] {
  const results: TileNumber[][] = []
  const n = openTiles.length

  for (let mask = 1; mask < (1 << n); mask++) {
    const combo: TileNumber[] = []
    let sum = 0
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        combo.push(openTiles[i])
        sum += openTiles[i]
      }
    }
    if (sum === target) results.push(combo)
  }

  return results
}

/** Open tile numbers for a tiles array (index 1–9, index 0 unused) */
export function openTiles(tiles: boolean[]): TileNumber[] {
  const open: TileNumber[] = []
  for (let i = 1; i <= 9; i++) {
    if (tiles[i]) open.push(i as TileNumber)
  }
  return open
}

/** §5 — score = sum of open tiles */
export function scoreTiles(tiles: boolean[]): number {
  return openTiles(tiles).reduce((s, t) => s + t, 0)
}

/** §8 — single die option available when sum of open tiles ≤ 6 */
function canUseSingleDie(tiles: boolean[]): boolean {
  return scoreTiles(tiles) <= 6
}

/** Fresh tile state — all open */
function freshTiles(): boolean[] {
  // index 0 unused; 1-9 = true (open)
  return [false, true, true, true, true, true, true, true, true, true]
}

// ─── State factory ────────────────────────────────────────────────────────────

export function createGame(playerNames: string[]): ShutTheBoxState {
  return {
    players: playerNames.map((name, id) => ({
      id,
      name,
      score: null,
      tiles: freshTiles(),
    })),
    currentPlayerIndex: 0,
    dice: [],
    diceTotal: 0,
    phase: 'roll',
    selectedTiles: [],
    canUseSingleDie: false,
    log: [],
    winner: null,
  }
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/** §4 Step 1 — Roll one or two dice */
export function actionRoll(state: ShutTheBoxState, useSingleDie = false): ShutTheBoxState {
  if (state.phase !== 'roll') return state

  const currentTiles = state.players[state.currentPlayerIndex].tiles
  const singleOk = canUseSingleDie(currentTiles)

  // §8 — can only use single die when allowed AND player chose it
  const numDice = useSingleDie && singleOk ? 1 : 2
  const dice = Array.from({ length: numDice }, rollDie) as DieValue[]
  const total = dice.reduce((s, d) => s + d, 0)

  const open = openTiles(currentTiles)
  const combos = validCombinations(open, total)
  const player = state.players[state.currentPlayerIndex]

  const logEntry = `${player.name} rolled [${dice.join(', ')}] = ${total}`

  if (combos.length === 0) {
    // §7 — bust immediately
    const score = scoreTiles(currentTiles)
    const bustLog = `${player.name} busts! Score: ${score}`
    const updatedPlayers = state.players.map((p) =>
      p.id === player.id ? { ...p, score } : p
    )
    return {
      ...state,
      dice,
      diceTotal: total,
      phase: 'bust',
      players: updatedPlayers,
      log: [...state.log, logEntry, bustLog],
    }
  }

  return {
    ...state,
    dice,
    diceTotal: total,
    phase: 'choose',
    selectedTiles: [],
    canUseSingleDie: singleOk,
    log: [...state.log, logEntry],
  }
}

/** Toggle a tile's selected state */
export function actionToggleTile(state: ShutTheBoxState, tile: TileNumber): ShutTheBoxState {
  if (state.phase !== 'choose') return state

  const currentTiles = state.players[state.currentPlayerIndex].tiles
  if (!currentTiles[tile]) return state  // already closed

  const already = state.selectedTiles.includes(tile)
  const newSelected = already
    ? state.selectedTiles.filter((t) => t !== tile)
    : [...state.selectedTiles, tile]

  return { ...state, selectedTiles: newSelected }
}

/** §4 Step 3 — Flip the selected tiles */
export function actionFlip(state: ShutTheBoxState): ShutTheBoxState {
  if (state.phase !== 'choose') return state
  if (state.selectedTiles.length === 0) return state

  const selectedSum = state.selectedTiles.reduce((s, t) => s + t, 0)
  if (selectedSum !== state.diceTotal) return state  // invalid — doesn't match roll

  const player = state.players[state.currentPlayerIndex]
  const newTiles = [...player.tiles]
  for (const t of state.selectedTiles) newTiles[t] = false  // flip down

  const allClosed = newTiles.slice(1).every((t) => !t)

  // §6 — shut the box
  if (allClosed) {
    const updatedPlayers = state.players.map((p) =>
      p.id === player.id ? { ...p, score: 0, tiles: newTiles } : p
    )
    const shutLog = `🎉 ${player.name} shut the box!`
    return checkEndOrNext({
      ...state,
      players: updatedPlayers,
      phase: 'shut',
      selectedTiles: [],
      log: [...state.log, shutLog],
    })
  }

  const updatedPlayers = state.players.map((p) =>
    p.id === player.id ? { ...p, tiles: newTiles } : p
  )
  const flipLog = `${player.name} flipped [${state.selectedTiles.join(', ')}]`

  return {
    ...state,
    players: updatedPlayers,
    phase: 'roll',
    selectedTiles: [],
    canUseSingleDie: canUseSingleDie(newTiles),
    log: [...state.log, flipLog],
  }
}

/** Advance after bust or shut */
export function actionAdvance(state: ShutTheBoxState): ShutTheBoxState {
  if (state.phase !== 'bust' && state.phase !== 'shut') return state
  return checkEndOrNext(state)
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** After a turn ends, either move to next player or end game */
function checkEndOrNext(state: ShutTheBoxState): ShutTheBoxState {
  const nextIdx = state.currentPlayerIndex + 1

  // §10 — all players done
  if (nextIdx >= state.players.length) {
    const scores = state.players.map((p) => p.score ?? scoreTiles(p.tiles))
    const minScore = Math.min(...scores)
    const winners = state.players
      .filter((_, i) => scores[i] === minScore)
      .map((p) => p.id)

    const winnerNames = winners.map((id) => state.players[id].name).join(' & ')
    const gameOverLog = `Game over! ${winnerNames} win${winners.length > 1 ? '' : 's'} with ${minScore} points!`

    return {
      ...state,
      phase: 'game-over',
      winner: winners,
      log: [...state.log, gameOverLog],
    }
  }

  // Next player's turn — reset tiles
  const logEntry = `--- ${state.players[nextIdx].name}'s turn ---`
  return {
    ...state,
    phase: 'roll',
    currentPlayerIndex: nextIdx,
    dice: [],
    diceTotal: 0,
    selectedTiles: [],
    canUseSingleDie: false,
    log: [...state.log, logEntry],
  }
}
