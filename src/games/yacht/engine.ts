/**
 * Yacht engine — pure logic, zero React, zero side-effects.
 * Every function cites the RULES.md section it implements.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type DieValue = 1 | 2 | 3 | 4 | 5 | 6

export interface Die {
  id: number       // stable identity 0–4
  value: DieValue
  held: boolean    // kept for next roll
}

/** §5 — the 12 scoring categories */
export type Category =
  | 'ones' | 'twos' | 'threes' | 'fours' | 'fives' | 'sixes'
  | 'fullHouse' | 'fourOfAKind' | 'littleStraight' | 'bigStraight'
  | 'choice' | 'yacht'

export const CATEGORIES: Category[] = [
  'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
  'fullHouse', 'fourOfAKind', 'littleStraight', 'bigStraight',
  'choice', 'yacht',
]

export const CATEGORY_LABELS: Record<Category, string> = {
  ones: 'Ones',
  twos: 'Twos',
  threes: 'Threes',
  fours: 'Fours',
  fives: 'Fives',
  sixes: 'Sixes',
  fullHouse: 'Full House',
  fourOfAKind: 'Four of a Kind',
  littleStraight: 'Little Straight',
  bigStraight: 'Big Straight',
  choice: 'Choice',
  yacht: 'Yacht',
}

/** null = not yet scored */
export type ScoreCard = Record<Category, number | null>

export type Phase = 'rolling' | 'scoring' | 'game-over'

export interface Player {
  id: number
  name: string
  scoreCard: ScoreCard
}

export interface YachtState {
  players: Player[]
  current: number       // index of active player
  round: number         // 1–12
  rollsLeft: number     // rolls remaining this turn (starts at 3, counts down)
  dice: Die[]
  phase: Phase
  log: string[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rollOne(): DieValue {
  return (Math.floor(Math.random() * 6) + 1) as DieValue
}

function counts(dice: Die[]): Record<DieValue, number> {
  const c = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 } as Record<DieValue, number>
  for (const d of dice) c[d.value]++
  return c
}

function sum(dice: Die[]): number {
  return dice.reduce((s, d) => s + d.value, 0)
}

/** §5 — score a set of 5 dice for a given category. Returns 0 if requirement not met. */
export function scoreFor(dice: Die[], category: Category): number {
  const c = counts(dice)
  const vals = dice.map(d => d.value)

  switch (category) {
    // §5 Upper section — sum of matching faces
    case 'ones':   return c[1] * 1
    case 'twos':   return c[2] * 2
    case 'threes': return c[3] * 3
    case 'fours':  return c[4] * 4
    case 'fives':  return c[5] * 5
    case 'sixes':  return c[6] * 6

    // §5 / §6 Full House — exactly 3 of one, 2 of another (not 5-of-a-kind)
    case 'fullHouse': {
      const groups = Object.values(c).filter(n => n > 0)
      if (groups.length === 2 && groups.includes(3) && groups.includes(2)) return sum(dice)
      return 0
    }

    // §5 / §6 Four of a Kind — at least 4 same; scores sum of all 5
    case 'fourOfAKind':
      return Object.values(c).some(n => n >= 4) ? sum(dice) : 0

    // §5 Little Straight — 1-2-3-4-5
    case 'littleStraight':
      return ([1, 2, 3, 4, 5] as DieValue[]).every(v => vals.includes(v)) ? 30 : 0

    // §5 Big Straight — 2-3-4-5-6
    case 'bigStraight':
      return ([2, 3, 4, 5, 6] as DieValue[]).every(v => vals.includes(v)) ? 30 : 0

    // §5 Choice — always sum of all dice
    case 'choice':
      return sum(dice)

    // §5 Yacht — all 5 same
    case 'yacht':
      return Object.values(c).some(n => n === 5) ? 50 : 0
  }
}

/** §8 — total score for a player */
export function totalScore(player: Player): number {
  return CATEGORIES.reduce((s, cat) => s + (player.scoreCard[cat] ?? 0), 0)
}

/** §8 — find winner indices (ties allowed) */
export function winners(players: Player[]): number[] {
  const scores = players.map(totalScore)
  const max = Math.max(...scores)
  return players.map((_, i) => (scores[i] === max ? i : -1)).filter(i => i !== -1)
}

function emptyScoreCard(): ScoreCard {
  return Object.fromEntries(CATEGORIES.map(c => [c, null])) as ScoreCard
}

// ─── State factory ────────────────────────────────────────────────────────────

/** §2 / §4 — create a new game */
export function createGame(playerNames: string[]): YachtState {
  return {
    players: playerNames.map((name, id) => ({
      id,
      name,
      scoreCard: emptyScoreCard(),
    })),
    current: 0,
    round: 1,
    rollsLeft: 3,
    dice: Array.from({ length: 5 }, (_, id) => ({
      id,
      value: 1 as DieValue,
      held: false,
    })),
    phase: 'rolling',
    log: [],
  }
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/** §4 Roll 1/2/3 — re-roll all non-held dice */
export function actionRoll(state: YachtState): YachtState {
  if (state.phase !== 'rolling') return state
  if (state.rollsLeft <= 0) return state

  const dice = state.dice.map(d =>
    d.held ? d : { ...d, value: rollOne(), held: false }
  )
  const rollsLeft = state.rollsLeft - 1
  // §4 — after 3rd roll move straight to scoring
  const phase: Phase = rollsLeft === 0 ? 'scoring' : 'rolling'
  const rollNum = 3 - rollsLeft  // 1, 2, or 3

  return {
    ...state,
    dice,
    rollsLeft,
    phase,
    log: [...state.log, `${state.players[state.current].name} rolled (roll ${rollNum}).`],
  }
}

/** §4 — toggle hold on a single die (only between rolls) */
export function actionToggleHold(state: YachtState, dieId: number): YachtState {
  if (state.phase !== 'rolling') return state
  if (state.rollsLeft === 3) return state  // haven't rolled yet this turn
  const dice = state.dice.map(d =>
    d.id === dieId ? { ...d, held: !d.held } : d
  )
  return { ...state, dice }
}

/** §4 — player opts to score now without using remaining rolls */
export function actionScoreNow(state: YachtState): YachtState {
  if (state.phase !== 'rolling') return state
  if (state.rollsLeft === 3) return state  // must roll at least once
  return { ...state, phase: 'scoring' }
}

/** §4 / §5 — player chooses a category to score */
export function actionScore(state: YachtState, category: Category): YachtState {
  if (state.phase !== 'scoring') return state
  const player = state.players[state.current]
  if (player.scoreCard[category] !== null) return state  // already scored

  const points = scoreFor(state.dice, category)
  const updatedPlayer: Player = {
    ...player,
    scoreCard: { ...player.scoreCard, [category]: points },
  }
  const players = state.players.map(p => p.id === player.id ? updatedPlayer : p)

  const scoreMsg = `${player.name} scored ${points} in ${CATEGORY_LABELS[category]}.`

  // §7 — check if game over (all 12 categories filled for all players = round 12 done)
  const isLastPlayer = state.current === state.players.length - 1
  const isLastRound = state.round === 12

  if (isLastRound && isLastPlayer) {
    const winnerIndices = winners(players)
    const winnerNames = winnerIndices.map(i => players[i].name).join(' & ')
    return {
      ...state,
      players,
      phase: 'game-over',
      log: [...state.log, scoreMsg, `Game over! ${winnerNames} win${winnerIndices.length === 1 ? 's' : ''}!`],
    }
  }

  // Advance to next player (or next round)
  const nextPlayer = isLastPlayer ? 0 : state.current + 1
  const nextRound = isLastPlayer ? state.round + 1 : state.round

  return {
    ...state,
    players,
    current: nextPlayer,
    round: nextRound,
    rollsLeft: 3,
    dice: Array.from({ length: 5 }, (_, id) => ({ id, value: 1 as DieValue, held: false })),
    phase: 'rolling',
    log: [...state.log, scoreMsg],
  }
}
