# Farkle — Authoritative Rules Reference

This document is the single source of truth for the Farkle implementation.
All game logic MUST match these rules exactly. Any deviation is a bug.

---

## 1. Objective

Be the first player to reach or exceed **10,000 points** AND survive the final round.

---

## 2. Players

- Minimum: **2 players**
- Maximum: **6 players**
- Turn order: fixed at game start, clockwise

---

## 3. Equipment

- **6 standard six-sided dice**
- A running score tracker per player

---

## 4. Turn Structure

A single turn proceeds as follows:

### Step 1 — Roll
- On the first roll of a turn, the player rolls **all 6 dice**.
- On subsequent rolls within the same turn, the player rolls only the **non-set-aside dice**.

### Step 2 — Evaluate
- After every roll, ALL dice are evaluated for scoring combinations (see Section 6).
- If **no dice score**, the roll is a **Farkle** (see Section 8). The turn ends immediately.

### Step 3 — Set Aside
- The player MUST set aside **at least one scoring die or combo** from the current roll.
- Dice set aside earlier in the same turn are **locked** and cannot be changed or un-set.
- Only dice from the **current roll** may be set aside during this step.
- Setting aside a partial combo is **not allowed**
  (e.g., cannot set aside two dice of a three-of-a-kind — must take all three or none).

### Step 4 — Decide
After setting aside, the player chooses:

**A) Bank** — add the accumulated turn total to their permanent score and end the turn.
- Requires meeting the **on-the-board minimum** (see Section 7) if not yet on the board.

**B) Roll Again** — roll the remaining non-set-aside dice, continuing the turn.
- If ALL 6 dice have been set aside (hot dice), the player MUST re-roll all 6 (see Section 9).

---

## 5. Turn Total

- The **turn total** is the running sum of all points scored from set-aside dice during the current turn.
- If the player Farkles at any point, the entire turn total is **lost** (not added to permanent score).
- Banked points are **permanent** and cannot be lost.

---

## 6. Scoring Combinations

Scoring is evaluated only on the dice rolled in the **current roll step**.
Previously set-aside dice do NOT combine with the current roll for new combos.

### Single Die Scores
| Die | Points |
|-----|--------|
| 1   | 100    |
| 5   | 50     |
| 2, 3, 4, 6 | 0 (unless part of a combo below) |

### Multi-Die Combinations (must all come from the same roll)
| Combination | Points | Notes |
|-------------|--------|-------|
| Three 1s | 1,000 | |
| Three 2s | 200 | |
| Three 3s | 300 | |
| Three 4s | 400 | |
| Three 5s | 500 | |
| Three 6s | 600 | |
| Four of a kind | 3× the three-of-a-kind value | e.g., four 3s = 900 |
| Five of a kind | 4× the three-of-a-kind value | e.g., five 3s = 1,200 |
| Six of a kind | 5× the three-of-a-kind value | e.g., six 3s = 1,500 |
| Six 1s | 5,000 | Special case of six of a kind |
| Straight (1-2-3-4-5-6) | 1,500 | All 6 dice, all different faces |
| Three pairs | 1,500 | All 6 dice form exactly three pairs (e.g., 2-2, 4-4, 6-6) |
| Four of a kind + a pair | 1,500 | All 6 dice used |
| Two triplets | 2,500 | All 6 dice form exactly two three-of-a-kinds |

### Combo Priority Rules
- When multiple combos are possible, the **highest-value valid grouping** is offered.
- A die cannot be counted in two combos simultaneously.
- Single 1s and 5s remaining after a combo is claimed ARE still scorable in the same roll.
  - Example: three 2s + one 1 = 200 + 100 = 300 total from that roll.
- A straight or special 6-dice combo takes precedence over any subset scoring.

---

## 7. Getting On the Board (Minimum Entry Score)

- A player is **not on the board** until they have banked at least **500 points in a single turn**.
- Until on the board, a player **cannot bank** a turn total below 500.
- If the player accumulates 500+ in a turn, they may bank normally.
- If a player is not on the board and cannot reach 500 without Farkling, they must keep rolling.
- There is no penalty for Farkling while trying to get on the board beyond losing the turn total.

---

## 8. Farkle

A Farkle occurs when a roll contains **zero scoring dice or combos**.

### Consequences
- The player's **entire turn total is lost**.
- The turn ends immediately — no banking, no more rolling.
- The player's **permanent score is unchanged**.
- A **Farkle counter** is tracked per player per consecutive turns (see Section 10).

### Farkle Detection
A roll is a Farkle if and only if:
- No single die shows a 1 or 5, AND
- No subset of the rolled dice forms any valid combo from Section 6.

---

## 9. Hot Dice

Hot dice occur when a player sets aside their last remaining non-set-aside die, meaning
**all 6 dice are now set aside**.

### Rules
- The player **must** roll all 6 dice again.
- The turn total accumulated so far **carries over** — it is not banked or lost.
- The re-roll is treated as a new roll step (go to Step 2 of turn structure).
- A Farkle on a hot dice re-roll loses the **entire accumulated turn total**, including points
  earned before the hot dice trigger.

---

## 10. Three Consecutive Farkles (House Rule — Enabled by Default)

- If a player Farkles on **three consecutive turns** (not within one turn — three separate turns),
  they **lose 1,000 points** from their permanent score.
- Permanent score may go negative as a result.
- The consecutive Farkle counter resets to zero after any turn in which the player successfully banks.
- This rule can be toggled off in game settings.

---

## 11. Winning — The Final Round

### Triggering the Final Round
- When a player **banks a score that reaches or exceeds 10,000**, the final round begins.
- That player's turn ends normally.
- All OTHER players get **exactly one more turn** each, in the original turn order.
- The triggering player does NOT get another turn.

### Resolving the Final Round
- Each remaining player takes their final turn normally (full turn rules apply).
- After all final turns are complete, the player with the **highest total score wins**.
- If the triggering player still has the highest score after all final turns, they win.
- If another player ties the triggering player's score, the **tied player wins**
  (they had to work harder — they weren't first to 10,000).

### Multiple Players Reaching 10,000 in the Final Round
- A player who reaches 10,000+ during the final round does NOT trigger another round.
- The final round is exactly one additional turn per non-triggering player, period.

---

## 12. Game End Conditions

| Condition | Result |
|-----------|--------|
| Final round completes | Highest score wins |
| Only one player remaining (others quit) | Remaining player wins |
| All players Farkle on final turn | Triggering player wins |

---

## 13. Player Actions Summary

At any point during a turn, the UI must offer exactly these actions and no others:

| Game State | Available Actions |
|------------|-------------------|
| Start of turn | Roll |
| After roll — scoring dice exist, nothing set aside yet | Set aside die/combo, (then Roll Again or Bank) |
| After setting aside at least one die — dice remain | Roll Again, Bank (if on board and total ≥ 500 or already on board) |
| After hot dice trigger | Roll (forced — no bank option until after re-roll) |
| Farkle | None — turn ends automatically |
| Not yet on board, turn total < 500 | Roll Again only (cannot bank) |

---

## 14. Score Display Requirements

At all times the UI must show:
- Each player's **permanent (banked) score**
- The **current turn total** (unbanked, at-risk points)
- The **current roll** (dice faces)
- Which dice are **set aside** (visually distinct)
- Whose **turn** it is
- Whether a player is **on the board** or not
- The **consecutive Farkle count** per player (if three-Farkle rule is enabled)
- A **game log** of recent events (rolled, set aside, banked, Farkled)
