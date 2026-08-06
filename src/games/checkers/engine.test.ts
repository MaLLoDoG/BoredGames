import { describe, it, expect } from 'vitest';
import {
  initialState,
  actionSelect,
  actionMove,
  actionContinueChain,
  actionResign,
  actionOfferDraw,
  actionAcceptDraw,
  actionDeclineDraw,
} from './engine';
import type { CheckersState, Cell } from './engine';

// Helper: build a sparse board from a list of [idx, cell] pairs
function makeBoard(pieces: [number, Cell][]): Cell[] {
  const board: Cell[] = Array(64).fill(null);
  for (const [i, c] of pieces) board[i] = c;
  return board;
}
function withBoard(board: Cell[], current: CheckersState['current'] = 'red'): CheckersState {
  return { ...initialState(), board, current };
}

// idx helper
const I = (r: number, c: number) => r * 8 + c;

// ─── §2 Initial Board ──────────────────────────────────────────────────────
describe('§2 initialState', () => {
  it('places 12 black men in rows 0–2 on dark squares', () => {
    const { board } = initialState();
    const blacks = board.filter(c => c === 'b');
    expect(blacks).toHaveLength(12);
  });
  it('places 12 red men in rows 5–7 on dark squares', () => {
    const { board } = initialState();
    const reds = board.filter(c => c === 'r');
    expect(reds).toHaveLength(12);
  });
  it('light squares are always null', () => {
    const { board } = initialState();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 0) expect(board[r * 8 + c]).toBeNull();
      }
    }
  });
  it('starts with red to move', () => {
    expect(initialState().current).toBe('red');
  });
  it('starts in select phase', () => {
    expect(initialState().phase).toBe('select');
  });
});

// ─── §9 actionSelect ───────────────────────────────────────────────────────
describe('§9 actionSelect', () => {
  it('does nothing outside select phase', () => {
    const s = { ...initialState(), phase: 'move' as const };
    expect(actionSelect(s, I(5, 1))).toBe(s);
  });
  it('does nothing when selecting enemy piece', () => {
    const s = initialState();
    expect(actionSelect(s, I(2, 1))).toBe(s); // black piece, red's turn
  });
  it('does nothing when selecting empty square', () => {
    const s = initialState();
    expect(actionSelect(s, I(3, 3))).toBe(s);
  });
  it('transitions to move phase on valid selection', () => {
    const s = initialState();
    // Row 5 dark squares: c=0,2,4,6 (5+c must be odd → c odd → 1,3,5,7 wrong;
    // 5 is odd so c must be even for (5+c) to be odd)
    const next = actionSelect(s, I(5, 0));
    expect(next.phase).toBe('move');
    expect(next.selected).toBe(I(5, 0));
  });
  it('red man at row 5 has forward moves to row 4', () => {
    const s = initialState();
    // (5,0): can move to (4,1) — (4,0) is a light square
    const next = actionSelect(s, I(5, 0));
    expect(next.legalMoves).toContain(I(4, 1));
  });
  it('§6 forces capture — cannot select non-capturing piece when captures exist', () => {
    // Red at (5,0) can capture black at (4,1), landing (3,2)
    // Red at (5,4) has no capture — should be rejected
    const board2 = makeBoard([[I(5, 0), 'r'], [I(4, 1), 'b'], [I(5, 4), 'r']]);
    const s2 = withBoard(board2, 'red');
    const next = actionSelect(s2, I(5, 4));
    expect(next.phase).toBe('select'); // rejected
  });
  it('§6 allows selecting capturing piece when captures exist', () => {
    const board = makeBoard([[I(5, 0), 'r'], [I(4, 1), 'b'], [I(5, 4), 'r']]);
    const s = withBoard(board, 'red');
    const next = actionSelect(s, I(5, 0));
    expect(next.phase).toBe('move');
    expect(next.legalMoves).toContain(I(3, 2));
  });
});

// ─── §3 Men movement ──────────────────────────────────────────────────────
describe('§3 men movement', () => {
  it('red man only moves toward lower rows', () => {
    const board = makeBoard([[I(4, 4), 'r']]);
    const s = withBoard(board, 'red');
    const next = actionSelect(s, I(4, 4));
    expect(next.legalMoves).toContain(I(3, 3));
    expect(next.legalMoves).toContain(I(3, 5));
    expect(next.legalMoves).not.toContain(I(5, 3));
    expect(next.legalMoves).not.toContain(I(5, 5));
  });
  it('black man only moves toward higher rows', () => {
    const board = makeBoard([[I(3, 3), 'b']]);
    const s = withBoard(board, 'black');
    const next = actionSelect(s, I(3, 3));
    expect(next.legalMoves).toContain(I(4, 2));
    expect(next.legalMoves).toContain(I(4, 4));
    expect(next.legalMoves).not.toContain(I(2, 2));
    expect(next.legalMoves).not.toContain(I(2, 4));
  });
  it('blocked by own piece', () => {
    const board = makeBoard([[I(4, 4), 'r'], [I(3, 3), 'r']]);
    const s = withBoard(board, 'red');
    const next = actionSelect(s, I(4, 4));
    expect(next.legalMoves).not.toContain(I(3, 3));
    expect(next.legalMoves).toContain(I(3, 5));
  });
  it('no moves at edge when blocked', () => {
    // (4,1) is a dark square; can go to (3,0) and (3,2)
    // (4,0) is a light square — use (4,1) instead
    const board = makeBoard([[I(4, 1), 'r']]);
    const s = withBoard(board, 'red');
    const next = actionSelect(s, I(4, 1));
    expect(next.legalMoves).toContain(I(3, 0));
    expect(next.legalMoves).toContain(I(3, 2));
  });
});

// ─── §4 Kings movement ────────────────────────────────────────────────────
describe('§4 king movement', () => {
  it('king moves in all four diagonals', () => {
    // (3,4): 3+4=7 odd ✓ dark square
    const board = makeBoard([[I(3, 4), 'R']]);
    const s = withBoard(board, 'red');
    const next = actionSelect(s, I(3, 4));
    expect(next.legalMoves).toContain(I(2, 3));
    expect(next.legalMoves).toContain(I(2, 5));
    expect(next.legalMoves).toContain(I(4, 3));
    expect(next.legalMoves).toContain(I(4, 5));
  });
  it('black king also moves in all four diagonals', () => {
    // (3,2): 3+2=5 odd ✓ dark square
    const board = makeBoard([[I(3, 2), 'B']]);
    const s = withBoard(board, 'black');
    const next = actionSelect(s, I(3, 2));
    expect(next.legalMoves).toContain(I(2, 1));
    expect(next.legalMoves).toContain(I(2, 3));
    expect(next.legalMoves).toContain(I(4, 1));
    expect(next.legalMoves).toContain(I(4, 3));
  });
});

// ─── §5 Captures ──────────────────────────────────────────────────────────
describe('§5 captures', () => {
  it('simple capture — red captures black, black piece removed', () => {
    // (5,0) dark: 5+0=5 odd ✓; black at (4,1): 4+1=5 odd ✓; land (3,2): 3+2=5 odd ✓
    const board = makeBoard([[I(5, 0), 'r'], [I(4, 1), 'b']]);
    const s = withBoard(board, 'red');
    let next = actionSelect(s, I(5, 0));
    next = actionMove(next, I(3, 2));
    expect(next.board[I(3, 2)]).toBe('r');
    expect(next.board[I(4, 1)]).toBeNull();
    expect(next.board[I(5, 0)]).toBeNull();
  });
  it('cannot capture own piece', () => {
    // red at (5,0), red at (4,1) — jump to (3,2) blocked
    const board = makeBoard([[I(5, 0), 'r'], [I(4, 1), 'r']]);
    const s = withBoard(board, 'red');
    const next = actionSelect(s, I(5, 0));
    expect(next.legalMoves).not.toContain(I(3, 2));
  });
  it('cannot jump when landing square is occupied', () => {
    // red at (5,0), black at (4,1), red at (3,2) — can't land
    const board = makeBoard([[I(5, 0), 'r'], [I(4, 1), 'b'], [I(3, 2), 'r']]);
    const s = withBoard(board, 'red');
    const next = actionSelect(s, I(5, 0));
    expect(next.legalMoves).not.toContain(I(3, 2));
  });
});

// ─── §7 Multi-jump chain ──────────────────────────────────────────────────
describe('§7 chain captures', () => {
  it('enters chain phase when further capture available after first jump', () => {
    // Red at (5,4): 5+4=9 odd ✓
    // Black at (4,5): 4+5=9 odd ✓  → red jumps to (3,6): 3+6=9 odd ✓
    // Black at (2,5): 2+5=7 odd ✓  → red jumps to (1,4): 1+4=5 odd ✓
    const board = makeBoard([[I(5, 4), 'r'], [I(4, 5), 'b'], [I(2, 5), 'b']]);
    const s = withBoard(board, 'red');
    let next = actionSelect(s, I(5, 4));
    expect(next.legalMoves).toContain(I(3, 6));
    next = actionMove(next, I(3, 6));
    expect(next.phase).toBe('chain');
    expect(next.chainPiece).toBe(I(3, 6));
    expect(next.legalMoves).toContain(I(1, 4));
  });
  it('captured pieces not removed until chain ends', () => {
    const board = makeBoard([[I(5, 4), 'r'], [I(4, 5), 'b'], [I(2, 5), 'b']]);
    const s = withBoard(board, 'red');
    let next = actionSelect(s, I(5, 4));
    next = actionMove(next, I(3, 6));
    // mid-chain: first captured piece still on board
    expect(next.board[I(4, 5)]).toBe('b'); // not yet removed
  });
  it('completes chain and removes all captured pieces', () => {
    const board = makeBoard([[I(5, 4), 'r'], [I(4, 5), 'b'], [I(2, 5), 'b']]);
    const s = withBoard(board, 'red');
    let next = actionSelect(s, I(5, 4));
    next = actionMove(next, I(3, 6));
    next = actionContinueChain(next, I(1, 4));
    expect(next.board[I(4, 5)]).toBeNull();
    expect(next.board[I(2, 5)]).toBeNull();
    expect(next.board[I(1, 4)]).toBe('r');
  });
  it('turn passes to opponent after chain completes', () => {
    // Extra black piece at (7,6) so black still has moves after the chain
    const board = makeBoard([[I(5, 4), 'r'], [I(4, 5), 'b'], [I(2, 5), 'b'], [I(6, 5), 'b']]);
    const s = withBoard(board, 'red');
    let next = actionSelect(s, I(5, 4));
    next = actionMove(next, I(3, 6));
    next = actionContinueChain(next, I(1, 4));
    expect(next.current).toBe('black');
    expect(next.phase).toBe('select');
  });
});

// ─── §8 Promotion ─────────────────────────────────────────────────────────
describe('§8 promotion', () => {
  it('red man promoted to king on reaching row 0', () => {
    // (1,2): 1+2=3 odd ✓ → moves to (0,1): 0+1=1 odd ✓
    const board = makeBoard([[I(1, 2), 'r']]);
    const s = withBoard(board, 'red');
    let next = actionSelect(s, I(1, 2));
    next = actionMove(next, I(0, 1));
    expect(next.board[I(0, 1)]).toBe('R');
  });
  it('black man promoted to king on reaching row 7', () => {
    // (6,1): 6+1=7 odd ✓ → moves to (7,0): 7+0=7 odd ✓
    const board = makeBoard([[I(6, 1), 'b']]);
    const s = withBoard(board, 'black');
    let next = actionSelect(s, I(6, 1));
    next = actionMove(next, I(7, 0));
    expect(next.board[I(7, 0)]).toBe('B');
  });
  it('§8 promotion ends turn — chain does not continue after promotion', () => {
    // red at (1,4): 1+4=5 odd ✓ → moves to (0,3): 0+3=3 odd ✓ — promoted
    // Need a surviving black piece so black has moves and red doesn't win
    const board = makeBoard([[I(1, 4), 'r'], [I(6, 5), 'b']]);
    const s = withBoard(board, 'red');
    let next = actionSelect(s, I(1, 4));
    next = actionMove(next, I(0, 3));
    expect(next.board[I(0, 3)]).toBe('R');
    expect(next.current).toBe('black');
    expect(next.phase).toBe('select');
  });
});

// ─── §9 actionMove ────────────────────────────────────────────────────────
describe('§9 actionMove', () => {
  it('does nothing outside move phase', () => {
    const s = initialState();
    expect(actionMove(s, I(4, 1))).toBe(s);
  });
  it('does nothing for illegal destination', () => {
    // (5,0) → legal moves are (4,1). (3,1) is illegal.
    const board = makeBoard([[I(5, 0), 'r']]);
    const s = withBoard(board, 'red');
    const next = actionSelect(s, I(5, 0));
    const illegal = actionMove(next, I(3, 1)); // not in legalMoves
    expect(illegal.phase).toBe('move');
  });
  it('advances to opponent turn after simple move', () => {
    // Need a black piece so black still has moves after red moves
    const board = makeBoard([[I(5, 0), 'r'], [I(6, 5), 'b']]);
    const s = withBoard(board, 'red');
    let next = actionSelect(s, I(5, 0));
    next = actionMove(next, I(4, 1));
    expect(next.current).toBe('black');
    expect(next.phase).toBe('select');
  });
  it('piece ends up at destination', () => {
    // (4,1): 4+1=5 odd ✓ → (3,0): 3+0=3 odd ✓
    const board = makeBoard([[I(4, 1), 'r']]);
    const s = withBoard(board, 'red');
    let next = actionSelect(s, I(4, 1));
    next = actionMove(next, I(3, 0));
    expect(next.board[I(3, 0)]).toBe('r');
    expect(next.board[I(4, 1)]).toBeNull();
  });
});

// ─── §10 Win & Draw ───────────────────────────────────────────────────────
describe('§10 win conditions', () => {
  it('current player wins when opponent has no moves', () => {
    // Red at (5,0), black at (4,1) — red captures black, black has no pieces left
    const board = makeBoard([[I(5, 0), 'r'], [I(4, 1), 'b']]);
    const s = withBoard(board, 'red');
    let next = actionSelect(s, I(5, 0));
    next = actionMove(next, I(3, 2));
    expect(next.winner).toBe('red');
    expect(next.phase).toBe('game-over');
  });
  it('actionResign — opponent wins', () => {
    const s = initialState();
    const next = actionResign(s);
    expect(next.winner).toBe('black');
    expect(next.phase).toBe('game-over');
  });
  it('actionResign does nothing if already game-over', () => {
    const s = { ...initialState(), phase: 'game-over' as const, winner: 'red' as const };
    expect(actionResign(s)).toBe(s);
  });
});

describe('§10 40-move draw', () => {
  it('declares draw after 40 non-capture moves', () => {
    // (0,1): 0+1=1 odd ✓; (7,6): 7+6=13 odd ✓
    const board = makeBoard([[I(0, 1), 'R'], [I(7, 6), 'B']]);
    const s: CheckersState = {
      ...initialState(),
      board,
      current: 'red',
      moveCount: 39,
      positionHistory: [],
    };
    // Red king at (0,1) → moves to (1,0): 1+0=1 odd ✓
    let next = actionSelect(s, I(0, 1));
    next = actionMove(next, I(1, 0));
    expect(next.winner).toBe('draw');
    expect(next.drawReason).toBe('40-move');
  });
});

describe('§10 draw by agreement', () => {
  it('draw offer logged', () => {
    const s = initialState();
    const next = actionOfferDraw(s);
    expect(next.drawOfferedBy).toBe('red');
  });
  it('opponent can accept draw', () => {
    const s = { ...initialState(), current: 'black' as const, drawOfferedBy: 'red' as const };
    const next = actionAcceptDraw(s);
    expect(next.winner).toBe('draw');
    expect(next.drawReason).toBe('agreement');
  });
  it('offerer cannot accept own draw', () => {
    const s = { ...initialState(), drawOfferedBy: 'red' as const };
    expect(actionAcceptDraw(s)).toBe(s);
  });
  it('opponent can decline draw', () => {
    const s = { ...initialState(), current: 'black' as const, drawOfferedBy: 'red' as const };
    const next = actionDeclineDraw(s);
    expect(next.drawOfferedBy).toBeNull();
    expect(next.winner).toBeNull();
  });
  it('offering draw clears after a move', () => {
    const board = makeBoard([[I(4, 4), 'r'], [I(3, 3), 'b']]);
    const s: CheckersState = {
      ...initialState(),
      board,
      current: 'red',
      drawOfferedBy: 'red',
    };
    let next = actionSelect(s, I(4, 4));
    // (5,5) or (5,3)? No wait: red moves toward lower rows, so (3,3) is occupied by black
    // Red at (4,4) can go to (3,5) (simple, (3,3) blocked), or capture black at (3,3)->land(2,2)
    // capture is mandatory
    next = actionMove(next, I(2, 2));
    expect(next.drawOfferedBy).toBeNull();
  });
});

describe('§10 repetition draw', () => {
  it('detects threefold repetition', () => {
    // Use dark squares: (0,1) and (7,6) for kings
    const board = makeBoard([[I(0, 1), 'R'], [I(7, 6), 'B']]);
    // The position after red moves to (1,2): R at (1,2), B at (7,6), black to move
    const boardAfterRed = [...board];
    boardAfterRed[I(0, 1)] = null;
    boardAfterRed[I(1, 2)] = 'R';
    const keyAfterRed = boardAfterRed.join('') + 'b';
    const s: CheckersState = {
      ...initialState(),
      board,
      current: 'red',
      moveCount: 0,
      // Already seen keyAfterRed twice before
      positionHistory: [board.join('') + 'r', keyAfterRed, keyAfterRed],
    };
    // Red king at (0,1) moves to (1,2): 1+2=3 odd ✓ → creates keyAfterRed for 3rd time
    let next = actionSelect(s, I(0, 1));
    next = actionMove(next, I(1, 2));
    expect(next.winner).toBe('draw');
    expect(next.drawReason).toBe('repetition');
  });
});
