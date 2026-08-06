import { describe, it, expect } from 'vitest'
import {
  scoreFor, totalScore, winners, createGame,
  actionRoll, actionToggleHold, actionScoreNow, actionScore,
  CATEGORIES,
} from './engine'
import type { Die, DieValue, YachtState, Player } from './engine'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dice(...values: DieValue[]): Die[] {
  return values.map((value, id) => ({ id, value, held: false }))
}

function stateWith(overrides: Partial<YachtState>): YachtState {
  return { ...createGame(['Alice', 'Bob']), ...overrides }
}

function rolledState(diceValues: DieValue[], rollsLeft = 2): YachtState {
  return stateWith({
    dice: dice(...diceValues),
    rollsLeft,
    phase: 'rolling',
  })
}

function scoringState(diceValues: DieValue[]): YachtState {
  return stateWith({ dice: dice(...diceValues), phase: 'scoring', rollsLeft: 0 })
}

// ─── §5 scoreFor — Upper section ─────────────────────────────────────────────

describe('§5 scoreFor — upper section', () => {
  it('ones: counts only 1s', () => {
    expect(scoreFor(dice(1, 1, 2, 3, 4), 'ones')).toBe(2)
  })
  it('ones: zero when no 1s', () => {
    expect(scoreFor(dice(2, 3, 4, 5, 6), 'ones')).toBe(0)
  })
  it('twos: sum of all 2s', () => {
    expect(scoreFor(dice(2, 2, 2, 3, 4), 'twos')).toBe(6)
  })
  it('threes: sum of all 3s', () => {
    expect(scoreFor(dice(3, 3, 1, 2, 5), 'threes')).toBe(6)
  })
  it('fours: sum of all 4s', () => {
    expect(scoreFor(dice(4, 4, 4, 4, 1), 'fours')).toBe(16)
  })
  it('fives: sum of all 5s', () => {
    expect(scoreFor(dice(5, 5, 5, 5, 5), 'fives')).toBe(25)
  })
  it('sixes: sum of all 6s', () => {
    expect(scoreFor(dice(6, 6, 1, 2, 3), 'sixes')).toBe(12)
  })
})

// ─── §5/§6 scoreFor — Full House ─────────────────────────────────────────────

describe('§5/§6 scoreFor — Full House', () => {
  it('3+2 = sum of all dice', () => {
    expect(scoreFor(dice(2, 2, 2, 5, 5), 'fullHouse')).toBe(16)
  })
  it('different values 3+2', () => {
    expect(scoreFor(dice(1, 1, 1, 6, 6), 'fullHouse')).toBe(15)
  })
  it('5 of a kind does NOT score as full house', () => {
    expect(scoreFor(dice(3, 3, 3, 3, 3), 'fullHouse')).toBe(0)
  })
  it('4+1 does NOT score as full house', () => {
    expect(scoreFor(dice(2, 2, 2, 2, 5), 'fullHouse')).toBe(0)
  })
  it('no match scores 0', () => {
    expect(scoreFor(dice(1, 2, 3, 4, 5), 'fullHouse')).toBe(0)
  })
})

// ─── §5/§6 scoreFor — Four of a Kind ─────────────────────────────────────────

describe('§5/§6 scoreFor — Four of a Kind', () => {
  it('exactly 4 = sum of all dice', () => {
    expect(scoreFor(dice(3, 3, 3, 3, 1), 'fourOfAKind')).toBe(13)
  })
  it('5 of a kind also satisfies four of a kind', () => {
    expect(scoreFor(dice(4, 4, 4, 4, 4), 'fourOfAKind')).toBe(20)
  })
  it('3 of a kind does not satisfy', () => {
    expect(scoreFor(dice(2, 2, 2, 3, 4), 'fourOfAKind')).toBe(0)
  })
})

// ─── §5 scoreFor — Straights ──────────────────────────────────────────────────

describe('§5 scoreFor — straights', () => {
  it('little straight 1-2-3-4-5 = 30', () => {
    expect(scoreFor(dice(1, 2, 3, 4, 5), 'littleStraight')).toBe(30)
  })
  it('little straight any order = 30', () => {
    expect(scoreFor(dice(3, 1, 5, 2, 4), 'littleStraight')).toBe(30)
  })
  it('big straight 2-3-4-5-6 = 30', () => {
    expect(scoreFor(dice(2, 3, 4, 5, 6), 'bigStraight')).toBe(30)
  })
  it('big straight any order = 30', () => {
    expect(scoreFor(dice(6, 4, 2, 3, 5), 'bigStraight')).toBe(30)
  })
  it('little straight does not satisfy big straight', () => {
    expect(scoreFor(dice(1, 2, 3, 4, 5), 'bigStraight')).toBe(0)
  })
  it('big straight does not satisfy little straight', () => {
    expect(scoreFor(dice(2, 3, 4, 5, 6), 'littleStraight')).toBe(0)
  })
  it('partial straight scores 0', () => {
    expect(scoreFor(dice(1, 2, 3, 4, 4), 'littleStraight')).toBe(0)
  })
})

// ─── §5 scoreFor — Choice ─────────────────────────────────────────────────────

describe('§5 scoreFor — Choice', () => {
  it('always scores sum of all dice', () => {
    expect(scoreFor(dice(1, 2, 3, 4, 5), 'choice')).toBe(15)
    expect(scoreFor(dice(6, 6, 6, 6, 6), 'choice')).toBe(30)
  })
})

// ─── §5 scoreFor — Yacht ──────────────────────────────────────────────────────

describe('§5 scoreFor — Yacht', () => {
  it('all 5 same = 50', () => {
    expect(scoreFor(dice(4, 4, 4, 4, 4), 'yacht')).toBe(50)
    expect(scoreFor(dice(1, 1, 1, 1, 1), 'yacht')).toBe(50)
  })
  it('4 of a kind does not score Yacht', () => {
    expect(scoreFor(dice(3, 3, 3, 3, 1), 'yacht')).toBe(0)
  })
})

// ─── §8 totalScore / winners ──────────────────────────────────────────────────

describe('§8 totalScore', () => {
  it('sums all non-null scorecard entries', () => {
    const state = createGame(['Alice'])
    const player: Player = {
      ...state.players[0],
      scoreCard: { ...state.players[0].scoreCard, ones: 3, twos: 6, threes: 0 },
    }
    expect(totalScore(player)).toBe(9)
  })

  it('null entries count as 0', () => {
    const state = createGame(['Alice'])
    expect(totalScore(state.players[0])).toBe(0)
  })
})

describe('§8 winners', () => {
  it('player with highest score wins', () => {
    const [a, b] = createGame(['Alice', 'Bob']).players
    const alice: Player = { ...a, scoreCard: { ...a.scoreCard, yacht: 50 } }
    const bob: Player = { ...b, scoreCard: { ...b.scoreCard, ones: 3 } }
    expect(winners([alice, bob])).toEqual([0])
  })

  it('tie — both win', () => {
    const [a, b] = createGame(['Alice', 'Bob']).players
    const alice: Player = { ...a, scoreCard: { ...a.scoreCard, ones: 3 } }
    const bob2: Player = { ...b, scoreCard: { ...b.scoreCard, ones: 3 } }
    expect(winners([alice, bob2])).toEqual([0, 1])
  })
})

// ─── §4 createGame ────────────────────────────────────────────────────────────

describe('createGame', () => {
  it('starts in rolling phase', () => {
    expect(createGame(['A', 'B']).phase).toBe('rolling')
  })
  it('starts at round 1', () => {
    expect(createGame(['A', 'B']).round).toBe(1)
  })
  it('starts with 3 rolls left', () => {
    expect(createGame(['A', 'B']).rollsLeft).toBe(3)
  })
  it('all scorecard entries are null', () => {
    const game = createGame(['A', 'B'])
    for (const p of game.players) {
      for (const cat of CATEGORIES) {
        expect(p.scoreCard[cat]).toBeNull()
      }
    }
  })
  it('creates correct number of players', () => {
    expect(createGame(['A', 'B', 'C']).players).toHaveLength(3)
  })
})

// ─── §4 actionRoll ────────────────────────────────────────────────────────────

describe('§4 actionRoll', () => {
  it('does nothing outside rolling phase', () => {
    const state = stateWith({ phase: 'scoring' })
    expect(actionRoll(state)).toBe(state)
  })

  it('does nothing when rollsLeft is 0', () => {
    const state = stateWith({ phase: 'rolling', rollsLeft: 0 })
    expect(actionRoll(state)).toBe(state)
  })

  it('decrements rollsLeft', () => {
    const state = stateWith({ phase: 'rolling', rollsLeft: 3 })
    expect(actionRoll(state).rollsLeft).toBe(2)
  })

  it('re-rolls non-held dice', () => {
    // hold die 0, roll everything else — die 0 value must stay
    const state = stateWith({
      phase: 'rolling',
      rollsLeft: 2,
      dice: [
        { id: 0, value: 6, held: true },
        { id: 1, value: 1, held: false },
        { id: 2, value: 1, held: false },
        { id: 3, value: 1, held: false },
        { id: 4, value: 1, held: false },
      ],
    })
    const next = actionRoll(state)
    expect(next.dice[0].value).toBe(6)
    expect(next.dice[0].held).toBe(true)
  })

  it('transitions to scoring after 3rd roll', () => {
    const state = stateWith({ phase: 'rolling', rollsLeft: 1 })
    expect(actionRoll(state).phase).toBe('scoring')
  })

  it('stays in rolling phase after 1st and 2nd rolls', () => {
    const s1 = stateWith({ phase: 'rolling', rollsLeft: 3 })
    const s2 = actionRoll(s1)
    expect(s2.phase).toBe('rolling')
    expect(s2.rollsLeft).toBe(2)
    const s3 = actionRoll(s2)
    expect(s3.phase).toBe('rolling')
    expect(s3.rollsLeft).toBe(1)
  })

  it('logs the roll', () => {
    const state = stateWith({ phase: 'rolling', rollsLeft: 3 })
    const next = actionRoll(state)
    expect(next.log[next.log.length - 1]).toContain('Alice')
    expect(next.log[next.log.length - 1]).toContain('roll 1')
  })
})

// ─── §4 actionToggleHold ─────────────────────────────────────────────────────

describe('§4 actionToggleHold', () => {
  it('does nothing outside rolling phase', () => {
    const state = scoringState([1, 2, 3, 4, 5])
    expect(actionToggleHold(state, 0)).toBe(state)
  })

  it('does nothing before first roll', () => {
    const state = stateWith({ phase: 'rolling', rollsLeft: 3 })
    expect(actionToggleHold(state, 0)).toBe(state)
  })

  it('holds an unheld die', () => {
    const state = rolledState([1, 2, 3, 4, 5])
    const next = actionToggleHold(state, 2)
    expect(next.dice[2].held).toBe(true)
  })

  it('un-holds a held die', () => {
    const state = stateWith({
      phase: 'rolling',
      rollsLeft: 2,
      dice: [
        { id: 0, value: 5, held: true },
        { id: 1, value: 2, held: false },
        { id: 2, value: 3, held: false },
        { id: 3, value: 4, held: false },
        { id: 4, value: 1, held: false },
      ],
    })
    const next = actionToggleHold(state, 0)
    expect(next.dice[0].held).toBe(false)
  })

  it('does not affect other dice', () => {
    const state = rolledState([1, 2, 3, 4, 5])
    const next = actionToggleHold(state, 1)
    expect(next.dice[0].held).toBe(false)
    expect(next.dice[2].held).toBe(false)
  })
})

// ─── §4 actionScoreNow ───────────────────────────────────────────────────────

describe('§4 actionScoreNow', () => {
  it('transitions to scoring from rolling', () => {
    const state = rolledState([1, 2, 3, 4, 5])
    expect(actionScoreNow(state).phase).toBe('scoring')
  })

  it('does nothing before first roll', () => {
    const state = stateWith({ phase: 'rolling', rollsLeft: 3 })
    expect(actionScoreNow(state)).toBe(state)
  })

  it('does nothing outside rolling phase', () => {
    const state = stateWith({ phase: 'scoring' })
    expect(actionScoreNow(state)).toBe(state)
  })
})

// ─── §4/§5 actionScore ───────────────────────────────────────────────────────

describe('§4/§5 actionScore', () => {
  it('does nothing outside scoring phase', () => {
    const state = rolledState([1, 1, 1, 1, 1])
    expect(actionScore(state, 'yacht')).toBe(state)
  })

  it('does nothing if category already scored', () => {
    const base = createGame(['Alice', 'Bob'])
    const players = base.players.map((p, i) =>
      i === 0 ? { ...p, scoreCard: { ...p.scoreCard, ones: 3 } } : p
    )
    const state = stateWith({ players, phase: 'scoring', dice: dice(1, 1, 1, 2, 3) })
    expect(actionScore(state, 'ones')).toBe(state)
  })

  it('records correct score for chosen category', () => {
    const state = scoringState([5, 5, 5, 5, 5])
    const next = actionScore(state, 'yacht')
    expect(next.players[0].scoreCard.yacht).toBe(50)
  })

  it('records 0 when requirement not met', () => {
    const state = scoringState([1, 2, 3, 4, 5])
    const next = actionScore(state, 'yacht')
    expect(next.players[0].scoreCard.yacht).toBe(0)
  })

  it('advances to next player after scoring', () => {
    const state = scoringState([1, 2, 3, 4, 5])
    const next = actionScore(state, 'choice')
    expect(next.current).toBe(1)
  })

  it('resets rollsLeft to 3 for next player', () => {
    const state = scoringState([1, 2, 3, 4, 5])
    const next = actionScore(state, 'choice')
    expect(next.rollsLeft).toBe(3)
  })

  it('advances round after last player scores', () => {
    const state = stateWith({
      current: 1,  // Bob is last player
      round: 1,
      phase: 'scoring',
      dice: dice(1, 2, 3, 4, 5),
    })
    const next = actionScore(state, 'choice')
    expect(next.round).toBe(2)
    expect(next.current).toBe(0)
  })

  it('logs the scoring event', () => {
    const state = scoringState([6, 6, 6, 6, 6])
    const next = actionScore(state, 'sixes')
    expect(next.log[next.log.length - 1]).toContain('Alice')
    expect(next.log[next.log.length - 1]).toContain('Sixes')
  })

  it('game ends after round 12 last player scores', () => {
    // Build a state where it's the last round, last player, fill everything
    const base = createGame(['Alice', 'Bob'])
    // Fill all categories for both players except one for Bob
    const filledCard = Object.fromEntries(CATEGORIES.map(c => [c, 0]))
    const aliceFull = { ...base.players[0], scoreCard: { ...filledCard } }
    const bobAlmostFull = {
      ...base.players[1],
      scoreCard: { ...filledCard, choice: null },
    }
    const state: YachtState = {
      ...base,
      players: [aliceFull, bobAlmostFull] as YachtState['players'],
      current: 1,
      round: 12,
      phase: 'scoring',
      dice: dice(1, 2, 3, 4, 5),
    }
    const next = actionScore(state, 'choice')
    expect(next.phase).toBe('game-over')
  })

  it('does not end game before round 12', () => {
    const state = stateWith({
      current: 1,
      round: 11,
      phase: 'scoring',
      dice: dice(1, 2, 3, 4, 5),
    })
    const next = actionScore(state, 'choice')
    expect(next.phase).not.toBe('game-over')
  })
})
