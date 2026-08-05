# Connect Four — Authoritative Rules Reference

This document is the single source of truth for the Connect Four implementation.
All game logic MUST match these rules exactly. Any deviation is a bug.

---

## 1. Objective

Be the first player to connect four of your own discs in a row —
horizontally, vertically, or diagonally.

---

## 2. Players

- Exactly **2 players**
- Player 1: Red 🔴
- Player 2: Yellow 🟡
- Player 1 always goes first

---

## 3. Equipment

- A **7-column × 6-row** vertical grid
- Columns are numbered 0–6 (left to right)
- Rows are numbered 0–5 (0 = bottom, 5 = top)
- Discs fall to the lowest available row in the chosen column (gravity)

---

## 4. Turn Structure

### Step 1 — Drop
- The current player chooses any column that is **not full**.
- A disc drops to the lowest empty row in that column.

### Step 2 — Evaluate
- Check for a win (§5).
- Check for a draw (§6).
- If neither, advance to the next player's turn.

---

## 5. Winning

A player wins immediately when they have **4 or more consecutive discs** in any of:
- A horizontal line (same row)
- A vertical line (same column)
- A diagonal line (↗ or ↘)

### Win Detection
Check all four directions from the last-placed disc:
- Horizontal: scan left and right along the same row
- Vertical: scan down along the same column (up never needed — disc just placed)
- Diagonal ↗: scan up-right and down-left
- Diagonal ↘: scan down-right and up-left

Count consecutive discs of the same colour in each direction.
If any direction yields a run of ≥ 4, the current player wins.

---

## 6. Draw

A draw occurs when:
- All 42 cells (7 × 6) are filled AND
- No player has won

The game ends immediately — no further moves are possible.

---

## 7. Column Full

A column is full when all 6 rows in that column are occupied.
The player **cannot** drop a disc into a full column.
The UI must visually indicate full columns and prevent selection.

---

## 8. Legal Moves

At any point, a legal move is any column index 0–6 where the top row (row 5) is empty.

---

## 9. Game End Conditions

| Condition | Result |
|-----------|--------|
| A player connects four | That player wins |
| All 42 cells filled with no winner | Draw |
| A player quits | The other player wins |

---

## 10. Display Requirements

At all times show:
- The full 7×6 grid with all placed discs
- Which player's turn it is and their colour
- Column drop indicators (hover/clickable arrows above each column)
- Full columns visually disabled
- Win announcement with the winning line highlighted
- Draw announcement
- A game log of moves
