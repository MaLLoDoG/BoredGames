# Checkers Rules (American / English Draughts)

## §1 Players & Pieces
- 2 players: **Red** (moves first) and **Black**.
- Each player starts with **12 pieces** on the dark squares of the three rows nearest to them.
- A normal piece is a **man**; a promoted piece is a **king** (marked with a crown).

## §2 Board Setup
- 8×8 board; only the **dark squares** are used (conventionally the squares where `(row + col) % 2 === 1`).
- Rows 0–2 are Black's starting rows (row 0 = top); rows 5–7 are Red's starting rows (row 7 = bottom).
- Board is stored as a flat array of 64 cells indexed `row * 8 + col`.
- Each cell value: `null` | `'r'` | `'R'` | `'b'` | `'B'`  
  (`r`=red man, `R`=red king, `b`=black man, `B`=black king)

## §3 Movement — Men
- A man moves **diagonally forward one square** to an unoccupied dark square.
  - Red men move toward **lower row indices** (up the board).
  - Black men move toward **higher row indices** (down the board).

## §4 Movement — Kings
- A king may move **diagonally one square in any of the four diagonal directions**.

## §5 Captures
- A piece captures by **jumping diagonally over an adjacent enemy piece** into the empty square immediately beyond.
- The captured piece is removed from the board **after the entire turn is complete** (§7).
- Only enemy pieces may be captured; friendly pieces block a jump.
- A capture move is mandatory if any capture is available (§6).

## §6 Forced Capture (Huffing Rule)
- If one or more capture moves exist for the current player, **the player MUST make a capture move**.
- If multiple capture sequences are available the player may choose any one.
- There is **no maximum-capture obligation** — the player may stop a multi-jump chain at any point after each individual jump (as long as no further captures are available from the landing square, or they choose to stop voluntarily — but see §7).

## §7 Multi-Jump (Chain Captures)
- After completing a capture, if the **same piece** can make another capture from its landing square, the turn continues and the player **must** keep jumping with that piece.
- Captures made during a chain are collected; all captured pieces are removed **at the end of the full chain** (not mid-jump).
- A piece that reaches the kings row **mid-chain** is **not** crowned until the chain ends; it may **not** continue capturing after promotion in the same turn.

## §8 Promotion (Kinging)
- A man that reaches the **far row** of the opponent is immediately promoted to a king.
  - Red man reaching row 0 → Red King (`'R'`).
  - Black man reaching row 7 → Black King (`'B'`).
- Promotion ends the turn (no further moves/jumps that turn, even if a king-move capture would be available).

## §9 Turn Structure
1. Player selects a piece they own (`actionSelect`).
2. If captures exist for the selected piece, only capture destinations are shown.
   - If captures exist anywhere on the board the player **must** select a piece that has captures.
3. Player selects a destination square (`actionMove`).
4. If the move is a capture and further captures exist from the landing square (and promotion did not occur), the turn enters **chain** phase — only that piece may continue jumping.
5. When no further captures are available (or the piece was just promoted), the captured pieces are removed, promotion is applied, and the turn passes to the opponent.

## §10 Win & Draw Conditions
- A player **wins** when the opponent has **no legal moves** (all pieces captured or completely blocked).
- A player may **resign** at any time (`actionResign`).
- **Draw by agreement**: either player may offer a draw (`actionOfferDraw`); the opponent may accept (`actionAcceptDraw`) or decline (`actionDeclineDraw`).
- **Draw by repetition**: if the same board position (including active player) occurs **3 times**, a draw is automatically declared.
- **Draw by 40-move rule**: if **40 consecutive moves** (both players combined) are made without a capture, a draw is declared.

## §11 State Shape

```ts
type Player = 'red' | 'black';
type Cell = null | 'r' | 'R' | 'b' | 'B';

interface CheckersState {
  board: Cell[];           // length 64
  current: Player;
  phase: 'select' | 'move' | 'chain' | 'game-over';
  selected: number | null; // index of selected piece
  chainPiece: number | null; // index of piece mid-chain
  captured: number[];      // indices captured this turn (removed at end)
  legalMoves: number[];    // destination indices for current selection
  winner: Player | 'draw' | null;
  drawReason: 'repetition' | '40-move' | 'agreement' | null;
  drawOfferedBy: Player | null;
  moveCount: number;       // increments each half-move; resets on capture
  positionHistory: string[]; // serialised board+player for repetition check
  log: string[];
}
```

## §12 Action Summary
| Action | Phase guard |
|--------|-------------|
| `actionSelect(idx)` | `select` — must own piece; if captures exist board-wide, piece must have captures |
| `actionMove(idx)` | `move` — idx must be in legalMoves |
| `actionContinueChain(idx)` | `chain` — idx must be in legalMoves |
| `actionResign()` | any non-game-over |
| `actionOfferDraw()` | `select` |
| `actionAcceptDraw()` | `select` (opponent received offer) |
| `actionDeclineDraw()` | `select` (opponent received offer) |
