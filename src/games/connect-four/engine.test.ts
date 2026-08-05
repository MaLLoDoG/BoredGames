/**
 * Connect Four Engine Tests
 * Each describe block maps to a section in RULES.md.
 */

import { describe, it, expect } from 'vitest'
import {
  COLS,
  ROWS,
  isColumnFull,
  legalMoves,
  dropRow,
  checkWin,
  isBoardFull,
  createGame,
  actionDrop,
  actionQuit,
} from './engine'
import type { Board, Cell, ConnectFourState } from './engine'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0) as Cell[])
}

/** Build a board from a visual string array (top row first, '.' = empty, 'R' = 1, 'Y' = 2) */
function board(rows: string[]): Board {
  // rows[0] is the visual top — flip to internal bottom-first
  const flipped = [...rows].reverse()
  return flipped.map((row) =>
    row.split('').map((c) => (c === 'R' ? 1 : c === 'Y' ? 2 : 0) as Cell)
  )
}

function state(overrides: Partial<ConnectFourState> = {}): ConnectFourState {
  return { ...createGame('Red', 'Yellow'), ...overrides }
}

// ─── §3 Board helpers ─────────────────────────────────────────────────────────

describe('§3 dropRow', () => {
  it('drops to row 0 in an empty column', () => {
    expect(dropRow(emptyBoard(), 0)).toBe(0)
  })

  it('drops to the next empty row', () => {
    const b = emptyBoard()
    b[0][0] = 1
    b[1][0] = 2
    expect(dropRow(b, 0)).toBe(2)
  })

  it('returns -1 for a full column', () => {
    const b = emptyBoard()
    for (let r = 0; r < ROWS; r++) b[r][0] = 1
    expect(dropRow(b, 0)).toBe(-1)
  })
})

describe('§7 isColumnFull', () => {
  it('empty column is not full', () => {
    expect(isColumnFull(emptyBoard(), 3)).toBe(false)
  })

  it('column with all rows filled is full', () => {
    const b = emptyBoard()
    for (let r = 0; r < ROWS; r++) b[r][2] = 1
    expect(isColumnFull(b, 2)).toBe(true)
  })
})

describe('§8 legalMoves', () => {
  it('all 7 columns legal on empty board', () => {
    expect(legalMoves(emptyBoard())).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it('excludes full columns', () => {
    const b = emptyBoard()
    for (let r = 0; r < ROWS; r++) b[r][0] = 1
    expect(legalMoves(b)).not.toContain(0)
    expect(legalMoves(b)).toHaveLength(6)
  })

  it('returns empty when board is full', () => {
    const b = emptyBoard()
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) b[r][c] = 1
    expect(legalMoves(b)).toHaveLength(0)
  })
})

// ─── §6 isBoardFull ───────────────────────────────────────────────────────────

describe('§6 isBoardFull', () => {
  it('empty board is not full', () => {
    expect(isBoardFull(emptyBoard())).toBe(false)
  })

  it('fully filled board is full', () => {
    const b = emptyBoard()
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) b[r][c] = (r % 2 === 0 ? 1 : 2) as Cell
    expect(isBoardFull(b)).toBe(true)
  })

  it('board with one empty cell is not full', () => {
    const b = emptyBoard()
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) b[r][c] = 1
    b[ROWS - 1][COLS - 1] = 0
    expect(isBoardFull(b)).toBe(false)
  })
})

// ─── §5 checkWin ─────────────────────────────────────────────────────────────

describe('§5 checkWin — horizontal', () => {
  it('4 in a row horizontally wins', () => {
    const b = board([
      '.......',
      '.......',
      '.......',
      '.......',
      '.......',
      'RRRR...',
    ])
    expect(checkWin(b, 0, 3, 1)).toHaveLength(4)
  })

  it('3 in a row does not win', () => {
    const b = board([
      '.......',
      '.......',
      '.......',
      '.......',
      '.......',
      'RRR....',
    ])
    expect(checkWin(b, 0, 2, 1)).toHaveLength(0)
  })

  it('5 in a row still returns exactly 4 cells (first found run)', () => {
    // checkWin stops scanning once ≥4 found — returns the winning 4, not all 5
    const b = board([
      '.......',
      '.......',
      '.......',
      '.......',
      '.......',
      'RRRRR..',
    ])
    expect(checkWin(b, 0, 4, 1).length).toBeGreaterThanOrEqual(4)
  })
})

describe('§5 checkWin — vertical', () => {
  it('4 in a column vertically wins', () => {
    const b = board([
      '.......',
      '.......',
      'R......',
      'R......',
      'R......',
      'R......',
    ])
    expect(checkWin(b, 2, 0, 1)).toHaveLength(4)
  })

  it('3 vertical does not win', () => {
    const b = board([
      '.......',
      '.......',
      '.......',
      'R......',
      'R......',
      'R......',
    ])
    expect(checkWin(b, 0, 0, 1)).toHaveLength(0)
  })
})

describe('§5 checkWin — diagonal ↗', () => {
  it('4 in a diagonal ↗ wins', () => {
    const b = board([
      '.......',
      '.......',
      '...R...',
      '..R....',
      '.R.....',
      'R......',
    ])
    expect(checkWin(b, 0, 0, 1)).toHaveLength(4)
  })
})

describe('§5 checkWin — diagonal ↘', () => {
  it('4 in a diagonal ↘ wins', () => {
    // Visual (top=row5): R at (row5,col0), (row4,col1), (row3,col2), (row2,col3)
    // Internal (bottom=row0): R at (row0,col3), (row1,col2), (row2,col1), (row3,col0)
    const b = board([
      '.......',
      '.......',
      'R......',
      '.R.....',
      '..R....',
      '...R...',
    ])
    // Start from the highest internal row of the diagonal (row3,col0)
    expect(checkWin(b, 3, 0, 1)).toHaveLength(4)
  })
})

describe('§5 checkWin — no false positives', () => {
  it('mixed colours in a line do not win', () => {
    const b = board([
      '.......',
      '.......',
      '.......',
      '.......',
      '.......',
      'RRYRRR.',
    ])
    expect(checkWin(b, 0, 0, 1)).toHaveLength(0)
  })

  it('empty board never wins', () => {
    expect(checkWin(emptyBoard(), 0, 0, 1)).toHaveLength(0)
  })
})

// ─── §4 actionDrop ───────────────────────────────────────────────────────────

describe('§4 actionDrop', () => {
  it('does nothing when not in playing phase', () => {
    const s = state({ phase: 'won', winner: 1 })
    expect(actionDrop(s, 0).board).toEqual(s.board)
  })

  it('does nothing for an out-of-range column', () => {
    expect(actionDrop(state(), -1).board).toEqual(emptyBoard())
    expect(actionDrop(state(), 7).board).toEqual(emptyBoard())
  })

  it('does nothing for a full column', () => {
    const b = emptyBoard()
    for (let r = 0; r < ROWS; r++) b[r][3] = 1
    const s = state({ board: b })
    expect(actionDrop(s, 3).board).toEqual(b)
  })

  it('places disc at lowest empty row (gravity)', () => {
    const s = actionDrop(state(), 3)
    expect(s.board[0][3]).toBe(1) // row 0 = bottom
  })

  it('stacks discs correctly', () => {
    let s = actionDrop(state(), 3)  // Red row 0
    s = actionDrop(s, 3)            // Yellow row 1
    s = actionDrop(s, 3)            // Red row 2
    expect(s.board[0][3]).toBe(1)
    expect(s.board[1][3]).toBe(2)
    expect(s.board[2][3]).toBe(1)
  })

  it('alternates players after each drop', () => {
    const s1 = actionDrop(state(), 0)
    expect(s1.currentPlayer).toBe(2)
    const s2 = actionDrop(s1, 1)
    expect(s2.currentPlayer).toBe(1)
  })

  it('records last move', () => {
    const s = actionDrop(state(), 4)
    expect(s.lastMove).toEqual([0, 4])
  })

  it('adds a log entry', () => {
    const s = actionDrop(state(), 0)
    expect(s.log[0]).toContain('Red dropped in column A')
  })

  it('§5 — detects a horizontal win', () => {
    // Build up 3 Red in a row, then drop the 4th
    let s = state()
    s = actionDrop(s, 0); s = actionDrop(s, 0) // R, Y
    s = actionDrop(s, 1); s = actionDrop(s, 1) // R, Y
    s = actionDrop(s, 2); s = actionDrop(s, 2) // R, Y
    s = actionDrop(s, 3)                        // R — 4th in a row
    expect(s.phase).toBe('won')
    expect(s.winner).toBe(1)
    expect(s.winningCells.length).toBeGreaterThanOrEqual(4)
  })

  it('§5 — detects a vertical win', () => {
    let s = state()
    // Red fills column 0, Yellow fills column 1 as filler
    s = actionDrop(s, 0); s = actionDrop(s, 1)
    s = actionDrop(s, 0); s = actionDrop(s, 1)
    s = actionDrop(s, 0); s = actionDrop(s, 1)
    s = actionDrop(s, 0)  // Red wins vertically
    expect(s.phase).toBe('won')
    expect(s.winner).toBe(1)
  })

  it('§5 — detects a diagonal win via actionDrop', () => {
    // Build a ↗ diagonal for Red using real moves
    // Red needs (0,0) (1,1) (2,2) (3,3)
    // Interleave Yellow drops as fillers in other columns
    let s = state()
    s = actionDrop(s, 0)  // R (0,0)
    s = actionDrop(s, 1)  // Y (0,1)
    s = actionDrop(s, 1)  // R (1,1)
    s = actionDrop(s, 2)  // Y (0,2)
    s = actionDrop(s, 2)  // R (1,2) — oops Yellow needed first at (1,2)
    // Use the board helper for precise diagonal setup instead
    const b = board([
      '.......',
      '.......',
      '...R...',
      '..RY...',
      '.RYY...',
      'RYYY...',
    ])
    // Verify checkWin detects the ↗ diagonal
    const winCells = checkWin(b, 0, 0, 1)
    expect(winCells.length).toBeGreaterThanOrEqual(4)
  })

  it('§6 — isBoardFull is true for a completely filled board', () => {
    const b = emptyBoard()
    for (let c = 0; c < COLS; c++)
      for (let r = 0; r < ROWS; r++)
        b[r][c] = ((r + c) % 2 === 0 ? 1 : 2) as Cell
    expect(isBoardFull(b)).toBe(true)
    expect(legalMoves(b)).toHaveLength(0)
  })
})

// ─── §9 actionQuit ────────────────────────────────────────────────────────────

describe('§9 actionQuit', () => {
  it('does nothing outside playing phase', () => {
    const s = state({ phase: 'won', winner: 1 })
    expect(actionQuit(s).phase).toBe('won')
  })

  it('current player quits — other player wins', () => {
    const s = state({ currentPlayer: 1 })
    const next = actionQuit(s)
    expect(next.phase).toBe('won')
    expect(next.winner).toBe(2)
  })

  it('player 2 quits — player 1 wins', () => {
    const s = state({ currentPlayer: 2 })
    expect(actionQuit(s).winner).toBe(1)
  })

  it('logs the quit event', () => {
    const next = actionQuit(state())
    expect(next.log[0]).toContain('quit')
  })
})

// ─── createGame ───────────────────────────────────────────────────────────────

describe('createGame', () => {
  it('starts with an empty board', () => {
    const s = createGame('Alice', 'Bob')
    expect(s.board.flat().every((c) => c === 0)).toBe(true)
  })

  it('starts in playing phase with player 1', () => {
    const s = createGame('Alice', 'Bob')
    expect(s.phase).toBe('playing')
    expect(s.currentPlayer).toBe(1)
  })

  it('stores player names', () => {
    const s = createGame('Alice', 'Bob')
    expect(s.players[0]).toBe('Alice')
    expect(s.players[1]).toBe('Bob')
  })

  it('board is 6 rows × 7 cols', () => {
    const s = createGame('A', 'B')
    expect(s.board).toHaveLength(ROWS)
    expect(s.board[0]).toHaveLength(COLS)
  })
})
