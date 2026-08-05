# Go Fish — Authoritative Rules Reference

This document is the single source of truth for the Go Fish implementation.
All game logic MUST match these rules exactly. Any deviation is a bug.

---

## 1. Objective

Collect the most **books** (sets of all four cards of the same rank).
The player with the most books when the draw pile is exhausted and all hands
are empty wins.

---

## 2. Players

- Minimum: **2 players**
- Maximum: **6 players**
- Turn order: fixed at game start

---

## 3. Equipment

- One standard **52-card deck** (no jokers)
- Ranks (13 total): A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K
- Suits (4 per rank): ♠ ♥ ♦ ♣

---

## 4. Deal

- **2 players**: each player receives **7 cards**
- **3–6 players**: each player receives **5 cards**
- Remaining cards form the **draw pile** (face-down)
- After dealing, each player immediately lays down any books already in hand (§6)

---

## 5. Turn Structure

On their turn the active player:

### Step 1 — Ask
- Chooses any **other player** to ask (the "target")
- Chooses a **rank** they currently hold at least one card of
- Asks: *"Do you have any [rank]s?"*
- A player may NOT ask for a rank they do not hold at least one card of

### Step 2a — Got one! (target has the rank)
- The target hands over **all** cards of that rank from their hand
- The active player adds those cards to their hand
- The active player **immediately checks for a book** of that rank (§6)
- The active player **takes another turn** (go back to Step 1)

### Step 2b — Go Fish! (target has none of that rank)
- The active player draws the **top card** of the draw pile
  - If the draw pile is empty, no card is drawn
- If the drawn card matches the rank asked for:
  - The active player keeps it, **checks for a book** (§6), and
    **takes another turn** (go back to Step 1) — this is called a "lucky fish"
- If the drawn card does NOT match the rank asked for:
  - The active player keeps it and their **turn ends**
- Turn passes to the next player (left / index + 1, wrapping)

---

## 6. Books

A **book** is all four cards of the same rank (one of each suit).

- Whenever a player obtains all four cards of a rank (whether from asking or
  drawing), they **immediately** lay that book face-up in front of them
- The four cards are removed from the player's hand and recorded as a completed book
- Books scored during a lucky-fish turn still grant an extra turn

---

## 7. Empty Hand Rule

- If a player's hand becomes empty (not from laying a book — only when they have
  no cards left after other actions), they **draw one card** from the draw pile
  before continuing
- If the draw pile is also empty, the player is out and takes no further turns
- A player whose hand is empty cannot be asked for cards and cannot ask

---

## 8. Game End

The game ends when **both** conditions are true:
- The draw pile is exhausted
- All players' hands are empty (or only players with empty hands and no pile remain)

The player with the **most books** wins.
Ties are allowed — all tied players share the win.

---

## 9. Hidden Information

- A player's hand is **private** — other players must not see it
- The UI enforces this via a **handoff screen** shown between turns
- The handoff screen covers the full display until the new active player
  taps "I'm Ready" — only then is their hand revealed
- During another player's turn, hands are never displayed

---

## 10. Phase Machine

| Phase | Description |
|-------|-------------|
| `handoff` | Cover screen — waiting for active player to tap "I'm Ready" |
| `ask` | Active player selects a target and a rank to ask for |
| `result-got` | Active player received cards — showing result before extra turn |
| `result-fish` | Active player went fishing — showing drawn card result |
| `game-over` | Game has ended, scores displayed |

---

## 11. Game End Conditions

| Condition | Result |
|-----------|--------|
| Draw pile empty AND all hands empty | Most books wins; ties allowed |
| Only one player remaining (others quit) | Remaining player wins |

---

## 12. Player Actions Summary

| Phase | Available Actions |
|-------|------------------|
| `handoff` | Tap "I'm Ready" |
| `ask` | Select target player, select rank, confirm ask |
| `result-got` | Tap "Take Another Turn" |
| `result-fish` | Tap "End Turn" (or auto-advance if lucky fish) |
| `game-over` | Quit to lobby |
