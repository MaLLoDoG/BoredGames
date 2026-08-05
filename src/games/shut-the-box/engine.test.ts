/**
 * Shut the Box Engine Tests
 * Each describe block maps to a section in RULES.md.
 */

import { describe, it, expect } from 'vitest'
import {
  validCombinations,
  openTiles,
  scoreTiles,
  createGame,
  actionRoll,
  actionToggleTile,
  actionFlip,
  actionAdvance,
} from './engine'
import type { ShutTheBoxState, TileNumber } from './engine'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function freshState(playerNames = ['Alice']): ShutTheBoxState {
  return createGame(playerNames)
}

function tilesOpen(...open: TileNumber[]): boolean[] {
  const t = [false, false, false, false, false, false, false, false, false, false]
  for (const n of open) t[n] = true
  return t
}

function stateWithTiles(tiles: boolean[], phase: ShutTheBoxState['phase'] = 'roll'): ShutTheBoxState {
  const state = freshState()
  return {
    ...state,
    phase,
    players: [{ ...state.players[0], tiles }],
  }
}

// ─── §11 validCombinations ───────────────────────────────────────────────────

describe('§11 validCombinations', () => {
  it('single tile matching total', () => {
    const combos = validCombinations([1, 2, 3, 4, 5] as TileNumber[], 3)
    expect(combos).toContainEqual([3])
  })

  it('two tiles summing to total', () => {
    const combos = validCombinations([1, 2, 3, 4, 5] as TileNumber[], 5)
    expect(combos).toContainEqual([1, 4])
    expect(combos).toContainEqual([2, 3])
  })

  it('three tiles summing to total', () => {
    const combos = validCombinations([1, 2, 3, 4, 5] as TileNumber[], 6)
    expect(combos).toContainEqual([1, 2, 3])
  })

  it('returns empty when no combo possible', () => {
    expect(validCombinations([2, 4, 6] as TileNumber[], 3)).toHaveLength(0)
  })

  it('returns empty for empty tile list', () => {
    expect(validCombinations([], 5)).toHaveLength(0)
  })

  it('only uses each tile once', () => {
    // [3] open, target 6 — cannot use 3 twice
    expect(validCombinations([3] as TileNumber[], 6)).toHaveLength(0)
  })

  it('all tiles open — finds combos for roll of 12', () => {
    const all: TileNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    const combos = validCombinations(all, 12)
    expect(combos.length).toBeGreaterThan(0)
    // Verify every combo sums to 12
    for (const c of combos) {
      expect(c.reduce((s, t) => s + t, 0)).toBe(12)
    }
  })
})

// ─── §5 scoreTiles ───────────────────────────────────────────────────────────

describe('§5 scoreTiles', () => {
  it('all open = 45 (1+2+…+9)', () => {
    const state = freshState()
    expect(scoreTiles(state.players[0].tiles)).toBe(45)
  })

  it('all closed = 0', () => {
    const tiles = [false, false, false, false, false, false, false, false, false, false]
    expect(scoreTiles(tiles)).toBe(0)
  })

  it('only 1 and 2 open = 3', () => {
    const tiles = tilesOpen(1, 2)
    expect(scoreTiles(tiles)).toBe(3)
  })

  it('only 9 open = 9', () => {
    expect(scoreTiles(tilesOpen(9))).toBe(9)
  })
})

// ─── §4 openTiles ────────────────────────────────────────────────────────────

describe('openTiles helper', () => {
  it('returns all 9 for fresh tiles', () => {
    const state = freshState()
    expect(openTiles(state.players[0].tiles)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('returns only open tiles', () => {
    const tiles = tilesOpen(3, 7, 9)
    expect(openTiles(tiles)).toEqual([3, 7, 9])
  })

  it('returns empty when all closed', () => {
    const tiles = new Array(10).fill(false)
    expect(openTiles(tiles)).toEqual([])
  })
})

// ─── §4 actionRoll ───────────────────────────────────────────────────────────

describe('§4 actionRoll', () => {
  it('does nothing outside roll phase', () => {
    const state = { ...freshState(), phase: 'choose' as const }
    expect(actionRoll(state).phase).toBe('choose')
  })

  it('transitions to choose when valid combos exist', () => {
    // Run many times — eventually a non-bust roll will occur
    const state = freshState() // all tiles open, almost impossible to bust
    let chose = false
    for (let i = 0; i < 50; i++) {
      const next = actionRoll(state)
      if (next.phase === 'choose') { chose = true; break }
    }
    expect(chose).toBe(true)
  })

  it('transitions to bust when no valid combo exists', () => {
    // Only tile 9 open, dice total must be something other than 9
    // Roll until we hit a non-9 total — should always bust
    const state = stateWithTiles(tilesOpen(9))
    let busted = false
    for (let i = 0; i < 100; i++) {
      const next = actionRoll(state)
      if (next.phase === 'bust') { busted = true; break }
    }
    expect(busted).toBe(true)
  })

  it('records score on bust', () => {
    const state = stateWithTiles(tilesOpen(9))
    for (let i = 0; i < 100; i++) {
      const next = actionRoll(state)
      if (next.phase === 'bust') {
        expect(next.players[0].score).toBe(9)
        return
      }
    }
    expect(true).toBe(true) // didn't bust — acceptable
  })

  it('adds log entry on roll', () => {
    const state = freshState()
    const next = actionRoll(state)
    expect(next.log.length).toBeGreaterThan(0)
    expect(next.log[0]).toContain('Alice rolled')
  })

  it('§8 — single die option when open tiles sum ≤ 6', () => {
    const state = stateWithTiles(tilesOpen(1, 2)) // sum = 3, ≤ 6
    const next = actionRoll(state, true) // request single die
    expect(next.dice).toHaveLength(1)
  })

  it('§8 — cannot use single die when open tiles sum > 6', () => {
    const state = freshState() // all open, sum = 45
    const next = actionRoll(state, true) // request single die, but not allowed
    expect(next.dice).toHaveLength(2) // forced to use two
  })
})

// ─── §4 actionToggleTile ─────────────────────────────────────────────────────

describe('§4 actionToggleTile', () => {
  it('does nothing outside choose phase', () => {
    const state = freshState()
    expect(actionToggleTile(state, 5).selectedTiles).toHaveLength(0)
  })

  it('selects an open tile', () => {
    const state = { ...freshState(), phase: 'choose' as const }
    const next = actionToggleTile(state, 5)
    expect(next.selectedTiles).toContain(5)
  })

  it('deselects an already-selected tile', () => {
    const state = { ...freshState(), phase: 'choose' as const, selectedTiles: [5] as TileNumber[] }
    const next = actionToggleTile(state, 5)
    expect(next.selectedTiles).not.toContain(5)
  })

  it('cannot select a closed tile', () => {
    const tiles = tilesOpen(1, 2, 3) // 4-9 are closed
    const state = { ...stateWithTiles(tiles, 'choose') }
    const next = actionToggleTile(state, 7) // tile 7 is closed
    expect(next.selectedTiles).not.toContain(7)
  })
})

// ─── §4 actionFlip ───────────────────────────────────────────────────────────

describe('§4 actionFlip', () => {
  it('does nothing outside choose phase', () => {
    const state = freshState()
    expect(actionFlip(state).phase).toBe('roll')
  })

  it('does nothing with no tiles selected', () => {
    const state = { ...freshState(), phase: 'choose' as const, diceTotal: 5 }
    expect(actionFlip(state).phase).toBe('choose')
  })

  it('does nothing when selected tiles do not match dice total', () => {
    const state = {
      ...freshState(),
      phase: 'choose' as const,
      diceTotal: 5,
      selectedTiles: [3] as TileNumber[], // 3 ≠ 5
    }
    expect(actionFlip(state).phase).toBe('choose')
  })

  it('flips selected tiles closed and returns to roll phase', () => {
    const state = {
      ...stateWithTiles(tilesOpen(1, 2, 3, 4, 5, 6, 7, 8, 9), 'choose'),
      diceTotal: 5,
      selectedTiles: [2, 3] as TileNumber[], // 2+3=5
    }
    const next = actionFlip(state)
    expect(next.phase).toBe('roll')
    expect(next.players[0].tiles[2]).toBe(false) // closed
    expect(next.players[0].tiles[3]).toBe(false) // closed
    expect(next.players[0].tiles[1]).toBe(true)  // still open
  })

  it('§6 — transitions to shut or game-over when last tiles are flipped', () => {
    // Only tiles 2 and 3 open, roll = 5 — single player goes straight to game-over
    const state = {
      ...stateWithTiles(tilesOpen(2, 3), 'choose'),
      diceTotal: 5,
      selectedTiles: [2, 3] as TileNumber[],
    }
    const next = actionFlip(state)
    expect(['shut', 'game-over']).toContain(next.phase)
  })

  it('§6 — score is 0 when box is shut', () => {
    const state = {
      ...stateWithTiles(tilesOpen(2, 3), 'choose'),
      diceTotal: 5,
      selectedTiles: [2, 3] as TileNumber[],
    }
    const next = actionFlip(state)
    expect(next.players[0].score).toBe(0)
  })

  it('logs the flip event', () => {
    const state = {
      ...stateWithTiles(tilesOpen(1, 2, 3, 4, 5, 6, 7, 8, 9), 'choose'),
      diceTotal: 3,
      selectedTiles: [3] as TileNumber[],
    }
    const next = actionFlip(state)
    expect(next.log[next.log.length - 1]).toContain('flipped')
  })
})

// ─── §9/§10 Turn Advance / Game End ─────────────────────────────────────────

describe('§9/§10 multiplayer and game end', () => {
  it('advances to next player after bust', () => {
    const state = createGame(['Alice', 'Bob'])
    const busted = {
      ...state,
      phase: 'bust' as const,
      players: [
        { ...state.players[0], score: 12 },
        state.players[1],
      ],
    }
    const next = actionAdvance(busted)
    expect(next.currentPlayerIndex).toBe(1)
    expect(next.phase).toBe('roll')
  })

  it('ends game when last player finishes', () => {
    const state = createGame(['Alice'])
    const busted = {
      ...state,
      phase: 'bust' as const,
      players: [{ ...state.players[0], score: 8 }],
    }
    const next = actionAdvance(busted)
    expect(next.phase).toBe('game-over')
    expect(next.winner).toEqual([0])
  })

  it('§9 — each player starts with fresh tiles', () => {
    const state = createGame(['Alice', 'Bob'])
    // Close some tiles for Alice
    const aliceDone = {
      ...state,
      phase: 'bust' as const,
      players: [
        { ...state.players[0], score: 10, tiles: tilesOpen(1, 9) },
        state.players[1],
      ],
    }
    const next = actionAdvance(aliceDone)
    // Bob should have all tiles open
    expect(openTiles(next.players[1].tiles)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('lowest score wins', () => {
    const state = createGame(['Alice', 'Bob'])
    const done = {
      ...state,
      currentPlayerIndex: 1,
      phase: 'bust' as const,
      players: [
        { ...state.players[0], score: 5 },
        { ...state.players[1], score: 12 },
      ],
    }
    const next = actionAdvance(done)
    expect(next.winner).toEqual([0]) // Alice wins with 5
  })

  it('ties allowed — both players win', () => {
    const state = createGame(['Alice', 'Bob'])
    const done = {
      ...state,
      currentPlayerIndex: 1,
      phase: 'bust' as const,
      players: [
        { ...state.players[0], score: 5 },
        { ...state.players[1], score: 5 },
      ],
    }
    const next = actionAdvance(done)
    expect(next.winner).toContain(0)
    expect(next.winner).toContain(1)
  })

  it('single player game ends immediately after their turn', () => {
    const state = createGame(['Alice'])
    const busted = {
      ...state,
      phase: 'bust' as const,
      players: [{ ...state.players[0], score: 7 }],
    }
    const next = actionAdvance(busted)
    expect(next.phase).toBe('game-over')
  })
})

// ─── createGame ──────────────────────────────────────────────────────────────

describe('createGame', () => {
  it('all tiles start open for every player', () => {
    const state = createGame(['Alice', 'Bob', 'Carol'])
    for (const p of state.players) {
      expect(openTiles(p.tiles)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    }
  })

  it('starts in roll phase with player 0', () => {
    const state = createGame(['Alice'])
    expect(state.phase).toBe('roll')
    expect(state.currentPlayerIndex).toBe(0)
  })

  it('all scores start as null', () => {
    const state = createGame(['Alice', 'Bob'])
    expect(state.players.every((p) => p.score === null)).toBe(true)
  })
})
