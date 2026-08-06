// Checkers engine — all rules cite src/games/checkers/RULES.md sections.

export type Player = 'red' | 'black';
export type Cell = null | 'r' | 'R' | 'b' | 'B';

export interface CheckersState {
  board: Cell[];
  current: Player;
  phase: 'select' | 'move' | 'chain' | 'game-over';
  selected: number | null;
  chainPiece: number | null;
  captured: number[];
  legalMoves: number[];
  winner: Player | 'draw' | null;
  drawReason: 'repetition' | '40-move' | 'agreement' | null;
  drawOfferedBy: Player | null;
  moveCount: number;
  positionHistory: string[];
  log: string[];
}

// §2 — only dark squares are used: (row+col)%2===1
function rc(idx: number): [number, number] {
  return [Math.floor(idx / 8), idx % 8];
}
function idx(row: number, col: number): number {
  return row * 8 + col;
}
function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

// §1 ownership helpers
function ownsCell(player: Player, cell: Cell): boolean {
  if (cell === null) return false;
  return player === 'red' ? cell === 'r' || cell === 'R' : cell === 'b' || cell === 'B';
}
function isEnemy(player: Player, cell: Cell): boolean {
  if (cell === null) return false;
  return !ownsCell(player, cell);
}
function isKing(cell: Cell): boolean {
  return cell === 'R' || cell === 'B';
}

// §3/§4 — diagonal directions available to a piece
function dirs(cell: Cell): [number, number][] {
  if (cell === 'r') return [[-1, -1], [-1, 1]];       // §3 red moves up
  if (cell === 'b') return [[1, -1], [1, 1]];          // §3 black moves down
  return [[-1, -1], [-1, 1], [1, -1], [1, 1]];        // §4 kings all dirs
}

// §5 — compute capture moves for a single piece
// alreadyCaptured: indices already collected this chain (still on board, must not be jumped again)
function capturesFor(
  board: Cell[],
  pieceIdx: number,
  player: Player,
  alreadyCaptured: number[] = [],
): number[] {
  const cell = board[pieceIdx];
  if (!cell || !ownsCell(player, cell)) return [];
  const [r, c] = rc(pieceIdx);
  const dests: number[] = [];
  for (const [dr, dc] of dirs(cell)) {
    const mr = r + dr;
    const mc = c + dc;
    const lr = r + dr * 2;
    const lc = c + dc * 2;
    if (!inBounds(lr, lc)) continue;
    const midI = idx(mr, mc);
    const mid = board[midI];
    const land = board[idx(lr, lc)];
    // §7 already-captured pieces cannot be jumped again mid-chain
    if (alreadyCaptured.includes(midI)) continue;
    if (mid !== null && isEnemy(player, mid) && land === null) {
      dests.push(idx(lr, lc));
    }
  }
  return dests;
}

// §5/§6 — all capture moves for a player (any piece)
function allCaptures(board: Cell[], player: Player): Map<number, number[]> {
  const result = new Map<number, number[]>();
  for (let i = 0; i < 64; i++) {
    if (ownsCell(player, board[i])) {
      const caps = capturesFor(board, i, player, []);
      if (caps.length > 0) result.set(i, caps);
    }
  }
  return result;
}

// §3/§4 — simple (non-capture) moves for a single piece
function simpleMoves(board: Cell[], pieceIdx: number, player: Player): number[] {
  const cell = board[pieceIdx];
  if (!cell || !ownsCell(player, cell)) return [];
  const [r, c] = rc(pieceIdx);
  const dests: number[] = [];
  for (const [dr, dc] of dirs(cell)) {
    const nr = r + dr;
    const nc = c + dc;
    if (inBounds(nr, nc) && board[idx(nr, nc)] === null) {
      dests.push(idx(nr, nc));
    }
  }
  return dests;
}

// §10 — has any legal move
function hasAnyMove(board: Cell[], player: Player): boolean {
  for (let i = 0; i < 64; i++) {
    if (!ownsCell(player, board[i])) continue;
    if (capturesFor(board, i, player).length > 0) return true;
    if (simpleMoves(board, i, player).length > 0) return true;
  }
  return false;
}

// §10 repetition key
function posKey(board: Cell[], player: Player): string {
  return board.join('') + player[0];
}

// §2 initial board
export function initialState(): CheckersState {
  const board: Cell[] = Array(64).fill(null);
  // §2 Black rows 0–2, Red rows 5–7, dark squares only
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) board[idx(r, c)] = 'b';
    }
  }
  for (let r = 5; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) board[idx(r, c)] = 'r';
    }
  }
  const log = ['Game started. Red moves first.'];
  return {
    board,
    current: 'red',
    phase: 'select',
    selected: null,
    chainPiece: null,
    captured: [],
    legalMoves: [],
    winner: null,
    drawReason: null,
    drawOfferedBy: null,
    moveCount: 0,
    positionHistory: [posKey(board, 'red')],
    log,
  };
}

// §9 actionSelect
export function actionSelect(state: CheckersState, pieceIdx: number): CheckersState {
  if (state.phase !== 'select') return state;
  const { board, current } = state;
  if (!ownsCell(current, board[pieceIdx])) return state;

  // §6 forced capture — if any capture exists on board, must pick a piece with captures
  const allCaps = allCaptures(board, current);
  const hasCaps = allCaps.size > 0;
  const pieceCaps = allCaps.get(pieceIdx) ?? [];

  if (hasCaps && pieceCaps.length === 0) return state; // must pick capturing piece

  const legalMoves = hasCaps ? pieceCaps : simpleMoves(board, pieceIdx, current);
  if (legalMoves.length === 0) return state;

  return { ...state, phase: 'move', selected: pieceIdx, legalMoves };
}

// §9 shared move applier (used by actionMove and actionContinueChain)
function applyMove(state: CheckersState, destIdx: number): CheckersState {
  const board = [...state.board] as Cell[];
  const { current, selected, captured } = state;
  const pieceIdx = selected!;
  const [pr, pc] = rc(pieceIdx);
  const [dr, dc] = rc(destIdx);

  const isCapture = Math.abs(dr - pr) === 2;
  const newCaptured = [...captured];

  if (isCapture) {
    // §5 mark mid-square as captured (removed at chain end)
    const midIdx = idx((pr + dr) / 2, (pc + dc) / 2);
    newCaptured.push(midIdx);
  }

  // move piece
  board[destIdx] = board[pieceIdx];
  board[pieceIdx] = null;

  // §8 promotion check — but don't remove captures yet
  const promotionRow = current === 'red' ? 0 : 7;
  const promoted = dr === promotionRow && !isKing(board[destIdx]);
  if (promoted) {
    board[destIdx] = current === 'red' ? 'R' : 'B';
  }

  // §7 can we continue the chain? Exclude already-captured pieces so they can't be re-jumped
  const chainCaps = isCapture && !promoted
    ? capturesFor(board, destIdx, current, newCaptured)
    : [];

  // §7/§9 if chain continues, stay in chain phase without removing captures yet
  if (chainCaps.length > 0) {
    return {
      ...state,
      board,
      phase: 'chain',
      selected: destIdx,
      chainPiece: destIdx,
      captured: newCaptured,
      legalMoves: chainCaps,
      drawOfferedBy: null,
      log: [...state.log, `${current} jumps to ${destIdx}`],
    };
  }

  // Turn ends — remove all captured pieces now (§7)
  for (const capIdx of newCaptured) {
    board[capIdx] = null;
  }

  // §10 move counter: resets on capture, else increments
  const wasCapture = isCapture || state.captured.length > 0; // chain had captures
  const newMoveCount = wasCapture ? 0 : state.moveCount + 1;

  const next: Player = current === 'red' ? 'black' : 'red';
  const newLog = [
    ...state.log,
    isCapture
      ? `${current} captures to ${destIdx} (${newCaptured.length} piece${newCaptured.length !== 1 ? 's' : ''} taken)`
      : `${current} moves to ${destIdx}`,
  ];

  // §10 win check
  if (!hasAnyMove(board, next)) {
    return {
      ...state,
      board,
      phase: 'game-over',
      selected: null,
      chainPiece: null,
      captured: [],
      legalMoves: [],
      winner: current,
      drawReason: null,
      drawOfferedBy: null,
      moveCount: newMoveCount,
      positionHistory: state.positionHistory,
      log: [...newLog, `${current} wins!`],
    };
  }

  // §10 40-move draw
  if (newMoveCount >= 40) {
    return {
      ...state,
      board,
      phase: 'game-over',
      selected: null,
      chainPiece: null,
      captured: [],
      legalMoves: [],
      winner: 'draw',
      drawReason: '40-move',
      drawOfferedBy: null,
      moveCount: newMoveCount,
      positionHistory: state.positionHistory,
      log: [...newLog, 'Draw — 40-move rule.'],
    };
  }

  // §10 repetition check
  const key = posKey(board, next);
  const newHistory = [...state.positionHistory, key];
  const repetitions = newHistory.filter(k => k === key).length;
  if (repetitions >= 3) {
    return {
      ...state,
      board,
      phase: 'game-over',
      selected: null,
      chainPiece: null,
      captured: [],
      legalMoves: [],
      winner: 'draw',
      drawReason: 'repetition',
      drawOfferedBy: null,
      moveCount: newMoveCount,
      positionHistory: newHistory,
      log: [...newLog, 'Draw — threefold repetition.'],
    };
  }

  return {
    ...state,
    board,
    current: next,
    phase: 'select',
    selected: null,
    chainPiece: null,
    captured: [],
    legalMoves: [],
    drawOfferedBy: null,
    moveCount: newMoveCount,
    positionHistory: newHistory,
    log: newLog,
  };
}

// §9 actionMove — from 'move' phase
export function actionMove(state: CheckersState, destIdx: number): CheckersState {
  if (state.phase !== 'move') return state;
  if (!state.legalMoves.includes(destIdx)) return state;
  return applyMove(state, destIdx);
}

// §9 actionContinueChain — from 'chain' phase
export function actionContinueChain(state: CheckersState, destIdx: number): CheckersState {
  if (state.phase !== 'chain') return state;
  if (!state.legalMoves.includes(destIdx)) return state;
  return applyMove(state, destIdx);
}

// §10 actionResign
export function actionResign(state: CheckersState): CheckersState {
  if (state.phase === 'game-over') return state;
  const winner: Player = state.current === 'red' ? 'black' : 'red';
  return {
    ...state,
    phase: 'game-over',
    winner,
    drawReason: null,
    log: [...state.log, `${state.current} resigned. ${winner} wins!`],
  };
}

// §10 draw offers
export function actionOfferDraw(state: CheckersState): CheckersState {
  if (state.phase !== 'select') return state;
  return {
    ...state,
    drawOfferedBy: state.current,
    log: [...state.log, `${state.current} offers a draw.`],
  };
}

export function actionAcceptDraw(state: CheckersState): CheckersState {
  if (state.phase !== 'select' || state.drawOfferedBy === null) return state;
  if (state.drawOfferedBy === state.current) return state; // can't accept own offer
  return {
    ...state,
    phase: 'game-over',
    winner: 'draw',
    drawReason: 'agreement',
    log: [...state.log, 'Draw agreed.'],
  };
}

export function actionDeclineDraw(state: CheckersState): CheckersState {
  if (state.phase !== 'select' || state.drawOfferedBy === null) return state;
  if (state.drawOfferedBy === state.current) return state;
  return {
    ...state,
    drawOfferedBy: null,
    log: [...state.log, `${state.current} declined the draw offer.`],
  };
}
