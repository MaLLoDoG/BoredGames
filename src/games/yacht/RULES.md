# Yacht — Authoritative Rules Reference

This document is the single source of truth for the Yacht implementation.
All game logic MUST match these rules exactly. Any deviation is a bug.

Yacht is the original public-domain game that Yahtzee™ is based on.

---

## 1. Objective

Fill every cell on your scorecard over 12 rounds. The player with the
highest total score after all rounds wins.

---

## 2. Players

- Minimum: **2 players**
- Maximum: **6 players**
- Turn order: fixed at game start
- Each player has their own independent scorecard

---

## 3. Equipment

- **5 standard six-sided dice**
- One scorecard per player with 12 scoring categories

---

## 4. Turn Structure

Each turn consists of up to **3 rolls**.

### Roll 1
- The player rolls **all 5 dice**.

### Roll 2 (optional)
- The player may **hold** any dice they wish to keep.
- Held dice are not re-rolled.
- The player re-rolls all non-held dice.
- A player may un-hold a die before rolling again.

### Roll 3 (optional)
- Same as Roll 2 — hold and re-roll.

### Scoring
- After any roll (1, 2, or 3), the player **must** choose a category to score.
- Once a category is chosen it is **locked** for the rest of the game.
- A player may score 0 in any empty category (deliberate sacrifice).
- After scoring, the turn passes to the next player.

---

## 5. Scoring Categories

### Upper Section (categories scored by face value)

| Category | How to score | Points |
|----------|-------------|--------|
| Ones | Sum of all 1s | 1× count |
| Twos | Sum of all 2s | 2× count |
| Threes | Sum of all 3s | 3× count |
| Fours | Sum of all 4s | 4× count |
| Fives | Sum of all 5s | 5× count |
| Sixes | Sum of all 6s | 6× count |

### Lower Section

| Category | Requirement | Points |
|----------|------------|--------|
| Full House | Three of one value + two of another | Sum of all 5 dice |
| Four of a Kind | At least 4 dice showing same value | Sum of all 5 dice |
| Little Straight | 1-2-3-4-5 in any order | 30 |
| Big Straight | 2-3-4-5-6 in any order | 30 |
| Choice | Any combination | Sum of all 5 dice |
| Yacht | All 5 dice showing same value | 50 |

---

## 6. Scoring Rules

- A category that does not meet its requirement scores **0** if chosen.
- **Choice** always scores the sum of all 5 dice, regardless of combination.
- **Full House**: three of one value AND two of another (different values required).
  - Five of a kind does NOT count as a Full House.
- **Four of a Kind**: at least 4 dice of the same face value.
  - Five of a kind DOES satisfy Four of a Kind.
- **Yacht**: all 5 dice the same face value — scores exactly 50.
- **Straights**: exact sequences, any order (not subsets).

---

## 7. Rounds

- The game lasts exactly **12 rounds** (one per scoring category).
- Every player takes a turn in each round before the round ends.
- Turn order is preserved throughout all 12 rounds.

---

## 8. Game End and Winning

- The game ends when all players have filled all 12 categories.
- The player with the **highest total score** wins.
- Ties are allowed — all tied players share the win.

---

## 9. Phase Machine

| Phase | Description |
|-------|-------------|
| `rolling` | Player is rolling — up to 3 rolls per turn; can hold/un-hold between rolls |
| `scoring` | Player has used all 3 rolls (or chosen to score early); must pick a category |
| `game-over` | All 12 rounds complete |

---

## 10. Player Actions Summary

| Phase | Available Actions |
|-------|------------------|
| `rolling` (roll < 3) | Hold/un-hold individual dice, Roll again, Score now (skip remaining rolls) |
| `rolling` (roll = 3) | Automatically advances to scoring after third roll |
| `scoring` | Click any empty scorecard category |
| `game-over` | Quit to lobby |
