/**
 * Farkle Engine — pure logic, zero React, zero side-effects.
 * Every function maps back to a numbered section in RULES.md.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type DieValue = 1 | 2 | 3 | 4 | 5 | 6

export interface Die {
  id: number        // stable identity (0-5)
  value: DieValue
  setAside: boolean // locked from a previous set-aside this turn
  held: boolean     // currently selected by player to set aside
}

export type TurnPhase =
  | 'roll'          // waiting for player to roll
  | 'select'        // dice rolled, player must select at least one scoring die
  | 'decide'        // player has selected ≥1 die, can roll again or bank
  | 'hot-dice'      // all 6 set aside — forced re-roll
  | 'farkle'        // no scoring dice — turn over
  | 'game-over'     // final round complete

export interface PlayerState {
  id: number
  name: string
  score: number         // permanent banked score
  onBoard: boolean      // has banked ≥500 in a single turn (§7)
  consecutiveFarkles: number  // for three-farkle rule (§10)
  quit: boolean         // player forfeited mid-game
}

export interface FarkleState {
  players: PlayerState[]
  currentPlayerIndex: number
  dice: Die[]
  turnTotal: number         // at-risk points this turn (§5)
  phase: TurnPhase
  finalRoundTriggeredBy: number | null  // player index who hit 10k
  finalRoundPlayersLeft: number[]       // indices yet to take final turn
  log: string[]
  settings: {
    threeFarkleRule: boolean  // §10
    targetScore: number       // §1 — 10000
  }
  winner: number | null     // player index of winner, set when game-over
  winByForfeit: boolean     // true when winner won because all others quit
}

// ─── Section 6 — Scoring ────────────────────────────────────────────────────

/**
 * Score a set of die values (from a single roll step).
 * Returns total points. Does NOT mutate state.
 * Rules §6.
 */
export function scoreDice(values: DieValue[]): number {
  if (values.length === 0) return 0

  const counts = new Array(7).fill(0)
  for (const v of values) counts[v]++

  // Six-dice special combos (§6 — must use all 6 dice)
  if (values.length === 6) {
    // Two triplets (§6) — 2500
    const triplets = [1, 2, 3, 4, 5, 6].filter((v) => counts[v] === 3)
    if (triplets.length === 2) return 2500

    // Straight 1-2-3-4-5-6 (§6) — 1500
    if ([1, 2, 3, 4, 5, 6].every((v) => counts[v] === 1)) return 1500

    // Three pairs (§6) — 1500
    const pairs = [1, 2, 3, 4, 5, 6].filter((v) => counts[v] === 2)
    if (pairs.length === 3) return 1500

    // Four of a kind + a pair (§6) — 1500
    const hasQuad = [1, 2, 3, 4, 5, 6].some((v) => counts[v] === 4)
    const hasPair = [1, 2, 3, 4, 5, 6].some((v) => counts[v] === 2)
    if (hasQuad && hasPair) return 1500
  }

  // Per-face scoring: of-a-kind combos + leftover singles
  let total = 0
  for (let face = 1; face <= 6; face++) {
    const n = counts[face]
    if (n === 0) continue

    const threeOfAKindBase = face === 1 ? 1000 : face * 100

    if (n >= 3) {
      // Six of a kind (§6) — 5× base (six 1s = 5000 special case)
      if (n === 6) {
        total += face === 1 ? 5000 : threeOfAKindBase * 5
      } else if (n === 5) {
        total += threeOfAKindBase * 4
      } else if (n === 4) {
        total += threeOfAKindBase * 3
      } else {
        total += threeOfAKindBase
      }
      // Leftover singles after the combo — only 1s and 5s score (§6)
      const leftover = n - (n >= 3 ? 3 + Math.max(0, n - 3) : n)
      // n is fully consumed by the combo above; no leftover singles for of-a-kind
      // (handled correctly since we consume all n dice in the combo)
      void leftover
    } else {
      // No combo — only 1s and 5s score as singles (§6)
      if (face === 1) total += n * 100
      else if (face === 5) total += n * 50
    }
  }

  return total
}

/**
 * Returns true if a roll is a Farkle — zero scoring dice (§8).
 */
export function isFarkle(values: DieValue[]): boolean {
  if (values.length === 0) return false  // no dice = no farkle
  return scoreDice(values) === 0
}

/**
 * Returns true if the selected dice form a valid, non-partial selection (§4 Step 3).
 * Rules:
 *  - Must include at least one die
 *  - Cannot select a partial combo (e.g. two of a three-of-a-kind)
 *  - The selected set must score > 0
 */
export function isValidSelection(selected: DieValue[], allRolled: DieValue[]): boolean {
  if (selected.length === 0) return false
  if (scoreDice(selected) === 0) return false

  // Check no partial combo: the unselected dice must not change the scoring
  // interpretation of the selected dice. We enforce this by verifying that
  // every face included in the selection is included in full combo units.
  const selectedCounts = new Array(7).fill(0)
  const allCounts = new Array(7).fill(0)
  for (const v of selected) selectedCounts[v]++
  for (const v of allRolled) allCounts[v]++

  for (let face = 1; face <= 6; face++) {
    const s = selectedCounts[face]
    const a = allCounts[face]
    if (s === 0) continue
    // If this face appears 3+ times in allRolled, a combo exists.
    // You must take all of them (the whole combo) or none.
    if (a >= 3 && s > 0 && s < 3) return false // partial triplet+
    // If a >= 3 and s >= 3, that's fine (full combo selected).
    // Singles (1s and 5s) with a < 3 can be taken in any quantity.
  }

  return true
}

// ─── Section 6 — Scoring breakdown (for UI display) ─────────────────────────

export interface ScoringCombo {
  label: string
  points: number
  diceIndices: number[]  // which dice (by position in the rolled array) make up this combo
}

/**
 * Returns a human-readable breakdown of all scoring combos in a roll.
 * Used by the UI to show what's available.
 */
export function getScoringCombos(dice: Die[]): ScoringCombo[] {
  const rolledDice = dice.filter((d) => !d.setAside)
  const values = rolledDice.map((d) => d.value)
  const combos: ScoringCombo[] = []

  if (values.length === 0) return combos

  const counts = new Array(7).fill(0)
  for (const v of values) counts[v]++
  const idxOf = (face: number, skip = 0): number => {
    let found = 0
    for (let i = 0; i < rolledDice.length; i++) {
      if (rolledDice[i].value === face) {
        if (found === skip) return i
        found++
      }
    }
    return -1
  }
  const allIdxOf = (face: number, count: number): number[] =>
    Array.from({ length: count }, (_, i) => idxOf(face, i))

  // Six-dice combos first
  if (values.length === 6) {
    const triplets = [1, 2, 3, 4, 5, 6].filter((v) => counts[v] === 3)
    if (triplets.length === 2) {
      return [{ label: 'Two Triplets', points: 2500, diceIndices: rolledDice.map((_, i) => i) }]
    }
    if ([1, 2, 3, 4, 5, 6].every((v) => counts[v] === 1)) {
      return [{ label: 'Straight', points: 1500, diceIndices: rolledDice.map((_, i) => i) }]
    }
    const pairs = [1, 2, 3, 4, 5, 6].filter((v) => counts[v] === 2)
    if (pairs.length === 3) {
      return [{ label: 'Three Pairs', points: 1500, diceIndices: rolledDice.map((_, i) => i) }]
    }
    const quadFace = [1, 2, 3, 4, 5, 6].find((v) => counts[v] === 4)
    const pairFace = [1, 2, 3, 4, 5, 6].find((v) => counts[v] === 2)
    if (quadFace !== undefined && pairFace !== undefined) {
      return [{ label: 'Four of a Kind + Pair', points: 1500, diceIndices: rolledDice.map((_, i) => i) }]
    }
  }

  // Per-face combos + singles
  const used = new Set<number>()
  for (let face = 1; face <= 6; face++) {
    const n = counts[face]
    if (n === 0) continue
    const base = face === 1 ? 1000 : face * 100

    if (n >= 6) {
      const pts = face === 1 ? 5000 : base * 5
      combos.push({ label: `Six ${face}s`, points: pts, diceIndices: allIdxOf(face, 6) })
      allIdxOf(face, 6).forEach((i) => used.add(i))
    } else if (n >= 5) {
      combos.push({ label: `Five ${face}s`, points: base * 4, diceIndices: allIdxOf(face, 5) })
      allIdxOf(face, 5).forEach((i) => used.add(i))
    } else if (n >= 4) {
      combos.push({ label: `Four ${face}s`, points: base * 3, diceIndices: allIdxOf(face, 4) })
      allIdxOf(face, 4).forEach((i) => used.add(i))
    } else if (n >= 3) {
      combos.push({ label: `Three ${face}s`, points: base, diceIndices: allIdxOf(face, 3) })
      allIdxOf(face, 3).forEach((i) => used.add(i))
    }
  }

  // Remaining singles (1s and 5s not already consumed by a combo)
  for (let i = 0; i < rolledDice.length; i++) {
    if (used.has(i)) continue
    const v = rolledDice[i].value
    if (v === 1) combos.push({ label: 'Single 1', points: 100, diceIndices: [i] })
    else if (v === 5) combos.push({ label: 'Single 5', points: 50, diceIndices: [i] })
  }

  return combos
}

// ─── Dice utilities ──────────────────────────────────────────────────────────

/** Roll a single die — cryptographically random is overkill for a board game,
 *  Math.random() is fine here. */
function rollOne(): DieValue {
  return (Math.floor(Math.random() * 6) + 1) as DieValue
}

/** Re-roll all dice that are not set aside. */
function rollDice(dice: Die[]): Die[] {
  return dice.map((d) =>
    d.setAside ? d : { ...d, value: rollOne(), held: false }
  )
}

/** Fresh set of 6 dice. */
function freshDice(): Die[] {
  return Array.from({ length: 6 }, (_, i) => ({
    id: i,
    value: rollOne(),
    setAside: false,
    held: false,
  }))
}

// ─── State factory ───────────────────────────────────────────────────────────

export function createGame(
  playerNames: string[],
  settings: Partial<FarkleState['settings']> = {}
): FarkleState {
  return {
    players: playerNames.map((name, id) => ({
      id,
      name,
      score: 0,
      onBoard: false,
      consecutiveFarkles: 0,
      quit: false,
    })),
    currentPlayerIndex: 0,
    dice: Array.from({ length: 6 }, (_, i) => ({
      id: i,
      value: 1 as DieValue,
      setAside: false,
      held: false,
    })),
    turnTotal: 0,
    phase: 'roll',
    finalRoundTriggeredBy: null,
    finalRoundPlayersLeft: [],
    log: [],
    settings: {
      threeFarkleRule: settings.threeFarkleRule ?? true,
      targetScore: settings.targetScore ?? 10000,
    },
    winner: null,
    winByForfeit: false,
  }
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/** §4 Step 1 — Roll the dice. */
export function actionRoll(state: FarkleState): FarkleState {
  if (state.phase !== 'roll' && state.phase !== 'hot-dice') return state

  const isHotDice = state.phase === 'hot-dice'
  const newDice = isHotDice
    ? freshDice().map((d) => ({ ...d, setAside: false, held: false }))
    : rollDice(state.dice)

  const rolledValues = newDice.filter((d) => !d.setAside).map((d) => d.value)
  const farkled = isFarkle(rolledValues)
  const player = state.players[state.currentPlayerIndex]
  const logEntry = `${player.name} rolled [${rolledValues.join(', ')}]${farkled ? ' — FARKLE!' : ''}`

  if (farkled) {
    // §8 — Farkle: turn total lost, consecutive farkle counter incremented
    const newConsecutive = player.consecutiveFarkles + 1
    let newScore = player.score
    let penaltyLog = ''

    // §10 — Three consecutive farkles
    if (state.settings.threeFarkleRule && newConsecutive >= 3) {
      newScore = player.score - 1000
      penaltyLog = ` ${player.name} loses 1,000 points for 3 consecutive farkles! (Score: ${newScore})`
    }

    const updatedPlayers = state.players.map((p) =>
      p.id === player.id
        ? { ...p, score: newScore, consecutiveFarkles: newConsecutive >= 3 ? 0 : newConsecutive }
        : p
    )

    return {
      ...state,
      dice: newDice,
      phase: 'farkle',
      players: updatedPlayers,
      turnTotal: 0,
      log: [...state.log, logEntry + penaltyLog],
    }
  }

  return {
    ...state,
    dice: newDice,
    phase: 'select',
    log: [...state.log, logEntry],
  }
}

/** Toggle a die's held state (player is choosing which dice to set aside). */
export function actionToggleHold(state: FarkleState, dieId: number): FarkleState {
  if (state.phase !== 'select' && state.phase !== 'decide') return state

  const die = state.dice.find((d) => d.id === dieId)
  if (!die || die.setAside) return state  // can't toggle a locked die

  const newDice = state.dice.map((d) =>
    d.id === dieId ? { ...d, held: !d.held } : d
  )

  // Validate the current held selection
  const heldValues = newDice.filter((d) => d.held).map((d) => d.value)
  const rolledValues = newDice.filter((d) => !d.setAside).map((d) => d.value)
  const selectionValid = heldValues.length === 0 || isValidSelection(heldValues, rolledValues)

  // Move to 'decide' if at least one valid die is held, back to 'select' if nothing held
  const newPhase =
    heldValues.length > 0 && selectionValid
      ? 'decide'
      : 'select'

  return { ...state, dice: newDice, phase: newPhase }
}

/** §4 Step 3 — Confirm the held dice as set-aside. */
export function actionConfirmSetAside(state: FarkleState): FarkleState {
  if (state.phase !== 'decide') return state

  const heldValues = state.dice.filter((d) => d.held).map((d) => d.value)
  const rolledValues = state.dice.filter((d) => !d.setAside).map((d) => d.value)

  if (!isValidSelection(heldValues, rolledValues)) return state

  const points = scoreDice(heldValues)
  const newTurnTotal = state.turnTotal + points
  const newDice = state.dice.map((d) =>
    d.held ? { ...d, setAside: true, held: false } : d
  )

  const allSetAside = newDice.every((d) => d.setAside)
  const player = state.players[state.currentPlayerIndex]
  const logEntry = `${player.name} set aside [${heldValues.join(', ')}] for ${points} pts (turn total: ${newTurnTotal})`

  return {
    ...state,
    dice: newDice,
    turnTotal: newTurnTotal,
    phase: allSetAside ? 'hot-dice' : 'decide',
    log: [...state.log, logEntry],
  }
}

/** §4 Step 4A — Bank points and end the turn. */
export function actionBank(state: FarkleState): FarkleState {
  if (state.phase !== 'decide') return state

  const player = state.players[state.currentPlayerIndex]
  const canBank = player.onBoard || state.turnTotal >= 500

  if (!canBank) return state  // §7 — not on board yet

  const newScore = player.score + state.turnTotal
  const getsOnBoard = !player.onBoard && state.turnTotal >= 500
  const triggersEnd = newScore >= state.settings.targetScore && state.finalRoundTriggeredBy === null
  const player2 = {
    ...player,
    score: newScore,
    onBoard: true,
    consecutiveFarkles: 0,
  }

  const updatedPlayers = state.players.map((p) => (p.id === player.id ? player2 : p))
  const logEntry = `${player.name} banked ${state.turnTotal} pts. Total: ${newScore}${getsOnBoard ? ' (on the board!)' : ''}${triggersEnd ? ' 🎯 Final round triggered!' : ''}`

  // §11 — Final round logic
  if (triggersEnd) {
    const remaining = state.players
      .filter((p) => p.id !== player.id)
      .map((p) => p.id)

    return {
      ...state,
      players: updatedPlayers,
      turnTotal: 0,
      phase: 'roll',
      finalRoundTriggeredBy: player.id,
      finalRoundPlayersLeft: remaining,
      currentPlayerIndex: nextPlayerIndex(state.currentPlayerIndex, state.players.length),
      dice: resetDice(state.dice),
      log: [...state.log, logEntry],
    }
  }

  return advanceTurn({ ...state, players: updatedPlayers, turnTotal: 0, log: [...state.log, logEntry] })
}

/** §4 Step 4B — Roll again. */
export function actionRollAgain(state: FarkleState): FarkleState {
  if (state.phase !== 'decide') return state

  // Confirm any held dice first, then go to roll phase
  const confirmed = actionConfirmSetAside(state)
  const allSetAside = confirmed.dice.every((d) => d.setAside)

  return { ...confirmed, phase: allSetAside ? 'hot-dice' : 'roll' }
}

/** Advance to the next player's turn. */
function advanceTurn(state: FarkleState): FarkleState {
  const nextIdx = nextPlayerIndex(state.currentPlayerIndex, state.players.length)

  // §11 — Are we in the final round?
  if (state.finalRoundTriggeredBy !== null) {
    const remaining = state.finalRoundPlayersLeft.filter((id) => id !== state.players[state.currentPlayerIndex].id)

    if (remaining.length === 0) {
      // Final round over — find winner
      // §11: on a tie the non-triggering player wins
      const winner = state.players.reduce((best, p) => {
        if (p.score > best.score) return p
        if (p.score === best.score && best.id === state.finalRoundTriggeredBy) return p
        return best
      })
      return {
        ...state,
        phase: 'game-over',
        winner: winner.id,
        finalRoundPlayersLeft: [],
        currentPlayerIndex: winner.id,
        log: [...state.log, `Game over! ${winner.name} wins with ${winner.score} points!`],
      }
    }

    return {
      ...state,
      finalRoundPlayersLeft: remaining,
      currentPlayerIndex: nextIdx,
      dice: resetDice(state.dice),
      phase: 'roll',
    }
  }

  return {
    ...state,
    currentPlayerIndex: nextIdx,
    dice: resetDice(state.dice),
    phase: 'roll',
  }
}

/** Called after a Farkle is acknowledged — advance to next player. */
export function actionAcknowledgeFarkle(state: FarkleState): FarkleState {
  if (state.phase !== 'farkle') return state
  return advanceTurn(state)
}

/** §12 — Quit. Mark the current player as forfeited. If only one active player
 *  remains, they win — even if the quitter had a higher score (forfeit = forfeit).
 *  All players stay in state.players so the game-over screen can show full scores.
 */
export function actionQuit(state: FarkleState): FarkleState {
  const quitter = state.players[state.currentPlayerIndex]
  const players = state.players.map((p) =>
    p.id === quitter.id ? { ...p, quit: true } : p
  )
  const active = players.filter((p) => !p.quit)
  const quitMsg = `${quitter.name} quit.`

  if (active.length === 1) {
    // Last one standing wins by forfeit — regardless of scores
    return {
      ...state,
      players,
      phase: 'game-over',
      winner: active[0].id,
      winByForfeit: true,
      log: [...state.log, `${quitMsg} ${active[0].name} wins by forfeit!`],
    }
  }

  if (active.length === 0) {
    // Shouldn't happen, but guard against it
    return { ...state, players, phase: 'game-over', winner: null, winByForfeit: false, log: [...state.log, quitMsg] }
  }

  // Multi-player: skip quitters when advancing turn
  const nextActive = active[(active.findIndex((p) => p.id > quitter.id) + active.length) % active.length]
  return {
    ...state,
    players,
    currentPlayerIndex: nextActive.id,
    dice: resetDice(state.dice),
    turnTotal: 0,
    phase: 'roll',
    log: [...state.log, quitMsg],
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nextPlayerIndex(current: number, total: number): number {
  return (current + 1) % total
}

function resetDice(dice: Die[]): Die[] {
  return dice.map((d) => ({ ...d, setAside: false, held: false, value: 1 as DieValue }))
}
