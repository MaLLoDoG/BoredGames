/**
 * Connect Four Engine — pure logic, zero React, zero side-effects.
 * Every function maps back to a numbered section in RULES.md.
 */

// ─── Constants (§3) ──────────────────────────────────────────────────────────

export const COLS = 7
export const ROWS = 6

// ─── Types ───────────────────────────────────────────────────────────────────

export type Cell = 0 | 1 | 2          // 0 = empty, 1 = player 1, 2 = player 2
export type Board = Cell[][]           // [row][col], row 0 = bottom

export type TurnPhase =
  | 'playing'
  | 'won'
  | 'draw'

export interface ConnectFourState {
  board: Board
  currentPlayer: 1 | 2
  phase: TurnPhase
  winner: 1 | 2 | null
  winningCells: [number, number][]     // [row, col] pairs of the winning line
  lastMove: [number, number] | null    // [row, col] of the last disc placed
  players: [string, string]            // [player1Name, player2Name]
  log: string[]
}

// ─── Board helpers ────────────────────────────────────────────────────────────

/** Create a fresh empty board */
function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0) as Cell[])
}

/** §7 — true if column col is full */
export function isColumnFull(board: Board, col: number): boolean {
  return board[ROWS - 1][col] !== 0
}

/** §8 — all legal column indices */
export function legalMoves(board: Board): number[] {
  return Array.from({ length: COLS }, (_, c) => c).filter((c) => !isColumnFull(board, c))
}

/** §3 — gravity: find the lowest empty row in a column. Returns -1 if full. */
export function dropRow(board: Board, col: number): number {
  for (let r = 0; r < ROWS; r++) {
    if (board[r][col] === 0) return r
  }
  return -1
}

// ─── §5 Win Detection ─────────────────────────────────────────────────────────

const DIRECTIONS: [number, number][] = [
  [0, 1],   // horizontal
  [1, 0],   // vertical
  [1, 1],   // diagonal ↗
  [1, -1],  // diagonal ↘
]

/**
 * Check if placing at (row, col) for player wins the game.
 * Returns the winning cells if so, empty array otherwise.
 */
export function checkWin(board: Board, row: number, col: number, player: Cell): [number, number][] {
  for (const [dr, dc] of DIRECTIONS) {
    const line: [number, number][] = [[row, col]]

    // Scan in positive direction
    for (let i = 1; i < 4; i++) {
      const r = row + dr * i
      const c = col + dc * i
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== player) break
      line.push([r, c])
    }

    // Scan in negative direction
    for (let i = 1; i < 4; i++) {
      const r = row - dr * i
      const c = col - dc * i
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== player) break
      line.push([r, c])
    }

    if (line.length >= 4) return line
  }
  return []
}

/** §6 — true if all cells are filled */
export function isBoardFull(board: Board): boolean {
  return board[ROWS - 1].every((cell) => cell !== 0)
}

// ─── State factory ────────────────────────────────────────────────────────────

export function createGame(player1Name: string, player2Name: string): ConnectFourState {
  return {
    board: emptyBoard(),
    currentPlayer: 1,
    phase: 'playing',
    winner: null,
    winningCells: [],
    lastMove: null,
    players: [player1Name, player2Name],
    log: [],
  }
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/** §4 — Drop a disc into column col */
export function actionDrop(state: ConnectFourState, col: number): ConnectFourState {
  if (state.phase !== 'playing') return state
  if (col < 0 || col >= COLS) return state
  if (isColumnFull(state.board, col)) return state

  const row = dropRow(state.board, col)
  const player = state.currentPlayer

  // Place the disc
  const newBoard = state.board.map((r, ri) =>
    ri === row ? r.map((c, ci) => (ci === col ? (player as Cell) : c)) : r
  ) as Board

  const playerName = state.players[player - 1]
  const colLabel = String.fromCharCode(65 + col) // A-G
  const logEntry = `${playerName} dropped in column ${colLabel}`

  // §5 — check win
  const winCells = checkWin(newBoard, row, col, player)
  if (winCells.length >= 4) {
    return {
      ...state,
      board: newBoard,
      phase: 'won',
      winner: player,
      winningCells: winCells,
      lastMove: [row, col],
      log: [...state.log, logEntry, `🏆 ${playerName} wins!`],
    }
  }

  // §6 — check draw
  if (isBoardFull(newBoard)) {
    return {
      ...state,
      board: newBoard,
      phase: 'draw',
      winner: null,
      lastMove: [row, col],
      log: [...state.log, logEntry, "It's a draw!"],
    }
  }

  // Next player
  const next = player === 1 ? 2 : 1
  return {
    ...state,
    board: newBoard,
    currentPlayer: next as 1 | 2,
    lastMove: [row, col],
    log: [...state.log, logEntry],
  }
}

/** §9 — Quit: other player wins */
export function actionQuit(state: ConnectFourState): ConnectFourState {
  if (state.phase !== 'playing') return state
  const quitter = state.players[state.currentPlayer - 1]
  const winner = state.currentPlayer === 1 ? 2 : 1
  const winnerName = state.players[winner - 1]
  return {
    ...state,
    phase: 'won',
    winner: winner as 1 | 2,
    winningCells: [],
    log: [...state.log, `${quitter} quit. ${winnerName} wins!`],
  }
}
