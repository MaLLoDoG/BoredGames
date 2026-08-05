# Shut the Box — Authoritative Rules Reference

This document is the single source of truth for the Shut the Box implementation.
All game logic MUST match these rules exactly. Any deviation is a bug.

---

## 1. Objective

Flip down all 9 tiles (numbered 1–9). Lowest score wins.
In single-player mode, aim for a score of zero ("shut the box").

---

## 2. Players

- Minimum: **1 player**
- Maximum: **4 players**
- Turn order: fixed at game start
- Each player takes a complete turn before passing

---

## 3. Equipment

- 9 tiles numbered 1 through 9 (all start face-up)
- 2 standard six-sided dice

---

## 4. Turn Structure

### Step 1 — Roll
- Roll **both dice**.
- Special rule: if the remaining open tiles sum to **6 or less**, the player may choose
  to roll **only one die** instead of two. This is optional — they may always roll both.

### Step 2 — Choose
- The player must choose a combination of **currently open tiles** that sum exactly
  to the dice total.
- Valid combinations: any subset of open tiles that add up to the roll.
- The player MUST find a valid combination. If none exists → bust (§7).

### Step 3 — Flip
- Flip down the chosen tiles. They are now closed for the rest of this turn.
- Return to Step 1 unless all tiles are closed (§6) or no valid move exists (§7).

---

## 5. Scoring

- At the end of a turn, the player's score is the **sum of all remaining open tiles**.
- Lower is better.
- A score of **0** means all tiles were closed — "shutting the box".

---

## 6. Shutting the Box

- If a player closes ALL 9 tiles, they score **0** and their turn ends immediately.
- In a multiplayer game, remaining players still take their turns.
- If multiple players score 0, they **tie**.

---

## 7. Bust (No Valid Move)

- If the dice total cannot be matched by any combination of open tiles, the turn ends.
- The player's score is the sum of remaining open tiles.
- This is NOT a penalty — it is simply how the turn ends.

---

## 8. Single-Die Option (§4 Step 1)

- Available only when the sum of ALL remaining open tiles ≤ 6.
- The player CHOOSES whether to use one or two dice — it is never forced.
- Rolling one die produces a value of 1–6.
- Rolling two dice produces a value of 2–12.

---

## 9. Multiplayer Turn Flow

- After a player's turn ends (bust or shut the box), tiles reset to all-open for the next player.
- Each player starts their turn with all 9 tiles open.
- After all players have taken one turn, the round is complete.
- The player with the **lowest score** wins.
- **Ties**: all tied players win.

---

## 10. Game End

- The game ends when every player has completed exactly **one turn**.
- Winner: lowest score. Ties are allowed.

---

## 11. Valid Combination Rules

A combination is valid if:
- All tiles in the combination are currently **open** (face-up)
- The tiles sum **exactly** to the dice total
- No tile is used more than once

The engine must enumerate all valid combinations and present them.
The player selects which tiles to flip — the engine enforces legality.

---

## 12. Display Requirements

At all times show:
- All 9 tiles — open (flippable) or closed (greyed out)
- The current dice roll
- The current dice total
- Whether single-die option is available
- All valid combinations for the current roll
- The current player's name
- All players' scores (dashes until their turn is complete)
- A game log of key events
