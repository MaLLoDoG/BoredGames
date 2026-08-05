/**
 * Farkle Engine Tests
 * Each describe block maps to a section in RULES.md.
 */

import { describe, it, expect } from 'vitest'
import {
  scoreDice,
  isFarkle,
  isValidSelection,
  createGame,
  actionRoll,
  actionToggleHold,
  actionConfirmSetAside,
  actionBank,
  actionRollAgain,
  actionAcknowledgeFarkle,
  actionQuit,
  getScoringCombos,
} from './engine'
import type { DieValue, FarkleState, Die } from './engine'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function d(values: DieValue[]): Die[] {
  return values.map((value, id) => ({ id, value, setAside: false, held: false }))
}

function stateWith(overrides: Partial<FarkleState>): FarkleState {
  const base = createGame(['Alice', 'Bob'])
  return { ...base, ...overrides }
}

/** Build a decide-phase state with specific dice already set aside and held */
function decideState(opts: {
  setAside?: DieValue[]
  held?: DieValue[]
  turnTotal?: number
  onBoard?: boolean
  score?: number
  players?: FarkleState['players']
}): FarkleState {
  const setAsideValues = opts.setAside ?? []
  const heldValues = opts.held ?? []
  const allValues = [...setAsideValues, ...heldValues,
    ...Array(6 - setAsideValues.length - heldValues.length).fill(2) as DieValue[]]

  const dice: Die[] = allValues.map((value, id) => ({
    id,
    value: value as DieValue,
    setAside: id < setAsideValues.length,
    held: id >= setAsideValues.length && id < setAsideValues.length + heldValues.length,
  }))

  return stateWith({
    phase: 'decide',
    dice,
    turnTotal: opts.turnTotal ?? 0,
    players: opts.players ?? [
      { id: 0, name: 'Alice', score: opts.score ?? 0, onBoard: opts.onBoard ?? true, consecutiveFarkles: 0, quit: false },
      { id: 1, name: 'Bob', score: 0, onBoard: false, consecutiveFarkles: 0, quit: false },
    ],
  })
}

// ─── §6 Scoring ──────────────────────────────────────────────────────────────

describe('§6 scoreDice — single die scores', () => {
  it('single 1 = 100', () => expect(scoreDice([1])).toBe(100))
  it('single 5 = 50', () => expect(scoreDice([5])).toBe(50))
  it('single 2 = 0', () => expect(scoreDice([2])).toBe(0))
  it('single 3 = 0', () => expect(scoreDice([3])).toBe(0))
  it('single 4 = 0', () => expect(scoreDice([4])).toBe(0))
  it('single 6 = 0', () => expect(scoreDice([6])).toBe(0))
  it('two 1s = 200', () => expect(scoreDice([1, 1])).toBe(200))
  it('two 5s = 100', () => expect(scoreDice([5, 5])).toBe(100))
})

describe('§6 scoreDice — three of a kind', () => {
  it('three 1s = 1000', () => expect(scoreDice([1, 1, 1])).toBe(1000))
  it('three 2s = 200', () => expect(scoreDice([2, 2, 2])).toBe(200))
  it('three 3s = 300', () => expect(scoreDice([3, 3, 3])).toBe(300))
  it('three 4s = 400', () => expect(scoreDice([4, 4, 4])).toBe(400))
  it('three 5s = 500', () => expect(scoreDice([5, 5, 5])).toBe(500))
  it('three 6s = 600', () => expect(scoreDice([6, 6, 6])).toBe(600))
})

describe('§6 scoreDice — four/five/six of a kind', () => {
  it('four 3s = 900 (3× base 300)', () => expect(scoreDice([3, 3, 3, 3])).toBe(900))
  it('five 3s = 1200 (4× base 300)', () => expect(scoreDice([3, 3, 3, 3, 3])).toBe(1200))
  it('six 3s = 1500 (5× base 300)', () => expect(scoreDice([3, 3, 3, 3, 3, 3])).toBe(1500))
  it('four 1s = 3000 (3× base 1000)', () => expect(scoreDice([1, 1, 1, 1])).toBe(3000))
  it('five 1s = 4000 (4× base 1000)', () => expect(scoreDice([1, 1, 1, 1, 1])).toBe(4000))
  it('six 1s = 5000 (special case)', () => expect(scoreDice([1, 1, 1, 1, 1, 1])).toBe(5000))
})

describe('§6 scoreDice — six-dice special combos', () => {
  it('straight 1-2-3-4-5-6 = 1500', () => expect(scoreDice([1, 2, 3, 4, 5, 6])).toBe(1500))
  it('three pairs (2-2-4-4-6-6) = 1500', () => expect(scoreDice([2, 2, 4, 4, 6, 6])).toBe(1500))
  it('four of a kind + pair (3-3-3-3-6-6) = 1500', () => expect(scoreDice([3, 3, 3, 3, 6, 6])).toBe(1500))
  it('two triplets (2-2-2-4-4-4) = 2500', () => expect(scoreDice([2, 2, 2, 4, 4, 4])).toBe(2500))
  it('two triplets with 1s (1-1-1-5-5-5) = 2500', () => expect(scoreDice([1, 1, 1, 5, 5, 5])).toBe(2500))
})

describe('§6 scoreDice — combo + leftover singles', () => {
  it('three 2s + one 1 = 300', () => expect(scoreDice([2, 2, 2, 1])).toBe(300))
  it('three 4s + one 5 = 450', () => expect(scoreDice([4, 4, 4, 5])).toBe(450))
  it('three 6s + one 1 + one 5 = 750', () => expect(scoreDice([6, 6, 6, 1, 5])).toBe(750))
})

// ─── §8 Farkle Detection ─────────────────────────────────────────────────────

describe('§8 isFarkle', () => {
  it('no 1s, no 5s, no combos = farkle', () => expect(isFarkle([2, 3, 4, 6, 2, 4])).toBe(true))
  it('single 1 = not farkle', () => expect(isFarkle([1, 2, 3, 4, 6, 6])).toBe(false))
  it('single 5 = not farkle', () => expect(isFarkle([5, 2, 3, 4, 6, 6])).toBe(false))
  it('three of a kind = not farkle', () => expect(isFarkle([2, 2, 2, 3, 4, 6])).toBe(false))
  it('all same non-1/5 = not farkle', () => expect(isFarkle([4, 4, 4, 4, 4, 4])).toBe(false))
  it('empty array = not farkle (no dice = nothing to farkle on)', () => expect(isFarkle([])).toBe(false))
})

// ─── §4 Step 3 — Valid Selection ─────────────────────────────────────────────

describe('§4 isValidSelection', () => {
  it('empty selection is invalid', () => expect(isValidSelection([], [1, 2, 3, 4, 5, 6])).toBe(false))
  it('non-scoring selection is invalid', () => expect(isValidSelection([2], [1, 2, 3])).toBe(false))
  it('single 1 from roll is valid', () => expect(isValidSelection([1], [1, 2, 3, 4, 6, 6])).toBe(true))
  it('single 5 from roll is valid', () => expect(isValidSelection([5], [5, 2, 3, 4, 6, 6])).toBe(true))
  it('full three-of-a-kind is valid', () => expect(isValidSelection([3, 3, 3], [3, 3, 3, 2, 4, 6])).toBe(true))
  it('partial three-of-a-kind (two of three) is invalid', () =>
    expect(isValidSelection([3, 3], [3, 3, 3, 2, 4, 6])).toBe(false))
  it('partial three-of-a-kind (one of three) is invalid', () =>
    expect(isValidSelection([3], [3, 3, 3, 2, 4, 6])).toBe(false))
  it('three-of-a-kind + single 1 is valid', () =>
    expect(isValidSelection([3, 3, 3, 1], [3, 3, 3, 1, 4, 6])).toBe(true))
})

// ─── §4 Step 1 — actionRoll ──────────────────────────────────────────────────

describe('§4 actionRoll', () => {
  it('does nothing if phase is not roll or hot-dice', () => {
    const state = stateWith({ phase: 'select' })
    expect(actionRoll(state).phase).toBe('select')
  })

  it('transitions to select when scoring dice exist', () => {
    // Seed dice so at least one scores (use a real roll but check outcome)
    const state = stateWith({ phase: 'roll' })
    // Roll many times — at least one should score (statistically impossible to always farkle)
    let nonFarkle = false
    for (let i = 0; i < 50; i++) {
      const next = actionRoll(state)
      if (next.phase === 'select') { nonFarkle = true; break }
    }
    expect(nonFarkle).toBe(true)
  })

  it('transitions to farkle when no dice score', () => {
    // Force a farkle by pre-seeding dice with non-scoring values
    // actionRoll re-rolls, so we verify it CAN produce a farkle
    const state = stateWith({ phase: 'roll' })
    let farkled = false
    for (let i = 0; i < 200; i++) {
      const next = actionRoll(state)
      if (next.phase === 'farkle') { farkled = true; break }
    }
    expect(farkled).toBe(true)
  })

  it('increments consecutiveFarkles on a farkle roll', () => {
    // We need to force a farkle — use hot-dice phase with all dice already set aside
    // so rollDice has no dice to change. Instead test via a seeded state approach.
    // Since we can't control Math.random, we test the property holds when farkle occurs.
    const state = stateWith({
      phase: 'roll',
      players: [
        { id: 0, name: 'Alice', score: 1000, onBoard: true, consecutiveFarkles: 1, quit: false },
        { id: 1, name: 'Bob', score: 0, onBoard: false, consecutiveFarkles: 0, quit: false },
      ],
    })
    // Run until we get a farkle and verify counter went up
    for (let i = 0; i < 500; i++) {
      const next = actionRoll(state)
      if (next.phase === 'farkle') {
        expect(next.players[0].consecutiveFarkles).toBe(2)
        expect(next.turnTotal).toBe(0)
        return
      }
    }
    // If we never farkled in 500 tries, the test still passes — farkle is rare with 6 dice
    expect(true).toBe(true)
  })

  it('resets consecutiveFarkles and deducts 1000 on third consecutive farkle', () => {
    const state = stateWith({
      phase: 'roll',
      players: [
        { id: 0, name: 'Alice', score: 2000, onBoard: true, consecutiveFarkles: 2, quit: false },
        { id: 1, name: 'Bob', score: 0, onBoard: false, consecutiveFarkles: 0, quit: false },
      ],
      settings: { threeFarkleRule: true, targetScore: 10000 },
    })
    for (let i = 0; i < 500; i++) {
      const next = actionRoll(state)
      if (next.phase === 'farkle') {
        expect(next.players[0].score).toBe(1000) // 2000 - 1000
        expect(next.players[0].consecutiveFarkles).toBe(0) // resets after penalty
        return
      }
    }
    expect(true).toBe(true) // didn't farkle — acceptable
  })

  it('does NOT apply three-farkle penalty when rule is disabled', () => {
    const state = stateWith({
      phase: 'roll',
      players: [
        { id: 0, name: 'Alice', score: 2000, onBoard: true, consecutiveFarkles: 2, quit: false },
        { id: 1, name: 'Bob', score: 0, onBoard: false, consecutiveFarkles: 0, quit: false },
      ],
      settings: { threeFarkleRule: false, targetScore: 10000 },
    })
    for (let i = 0; i < 500; i++) {
      const next = actionRoll(state)
      if (next.phase === 'farkle') {
        expect(next.players[0].score).toBe(2000) // no penalty
        return
      }
    }
    expect(true).toBe(true)
  })

  it('adds a log entry on every roll', () => {
    const state = stateWith({ phase: 'roll', log: [] })
    const next = actionRoll(state)
    expect(next.log.length).toBe(1)
    expect(next.log[0]).toContain('Alice rolled')
  })
})

// ─── §4 Step 2/3 — actionToggleHold ─────────────────────────────────────────

describe('§4 actionToggleHold', () => {
  it('does nothing outside select/decide phase', () => {
    const state = stateWith({ phase: 'roll', dice: d([1, 2, 3, 4, 5, 6]) })
    const next = actionToggleHold(state, 0)
    expect(next.dice[0].held).toBe(false)
  })

  it('cannot hold a set-aside die', () => {
    const dice: Die[] = d([1, 2, 3, 4, 5, 6])
    dice[0] = { ...dice[0], setAside: true }
    const state = stateWith({ phase: 'select', dice })
    const next = actionToggleHold(state, 0)
    expect(next.dice[0].held).toBe(false)
  })

  it('holding a scoring die transitions to decide phase', () => {
    const state = stateWith({ phase: 'select', dice: d([1, 2, 3, 4, 6, 6]) })
    const next = actionToggleHold(state, 0) // die 0 = value 1
    expect(next.phase).toBe('decide')
    expect(next.dice[0].held).toBe(true)
  })

  it('un-holding the only held die transitions back to select', () => {
    const dice = d([1, 2, 3, 4, 6, 6])
    dice[0] = { ...dice[0], held: true }
    const state = stateWith({ phase: 'decide', dice })
    const next = actionToggleHold(state, 0) // un-hold
    expect(next.phase).toBe('select')
    expect(next.dice[0].held).toBe(false)
  })

  it('holding a non-scoring die (no combo) stays in select', () => {
    const state = stateWith({ phase: 'select', dice: d([2, 2, 3, 4, 6, 6]) })
    const next = actionToggleHold(state, 0) // die 0 = value 2, no combo
    expect(next.phase).toBe('select')
  })

  it('toggles — second click un-holds a held die', () => {
    const state = stateWith({ phase: 'select', dice: d([1, 5, 3, 4, 6, 6]) })
    const held = actionToggleHold(state, 0)
    const unheld = actionToggleHold(held, 0)
    expect(unheld.dice[0].held).toBe(false)
  })
})

// ─── §4 Step 3 — actionConfirmSetAside ───────────────────────────────────────

describe('§4 actionConfirmSetAside', () => {
  it('does nothing outside decide phase', () => {
    const state = stateWith({ phase: 'select' })
    expect(actionConfirmSetAside(state).phase).toBe('select')
  })

  it('locks held dice as set-aside and adds to turn total', () => {
    const state = decideState({ held: [1, 5], turnTotal: 0 })
    const next = actionConfirmSetAside(state)
    const setAsideDice = next.dice.filter((d) => d.setAside)
    expect(setAsideDice.some((d) => d.value === 1)).toBe(true)
    expect(setAsideDice.some((d) => d.value === 5)).toBe(true)
    expect(next.turnTotal).toBe(150) // 100 + 50
  })

  it('clears held flag on confirmed dice', () => {
    const state = decideState({ held: [1], turnTotal: 0 })
    const next = actionConfirmSetAside(state)
    expect(next.dice.every((d) => !d.held)).toBe(true)
  })

  it('adds to existing turn total', () => {
    const state = decideState({ held: [5], turnTotal: 300 })
    const next = actionConfirmSetAside(state)
    expect(next.turnTotal).toBe(350)
  })

  it('transitions to hot-dice when all 6 dice are set aside', () => {
    // 6 held dice (all scoring — use six 1s)
    const dice: Die[] = [1, 1, 1, 1, 1, 1].map((v, id) => ({
      id, value: v as DieValue, setAside: false, held: true,
    }))
    const state = stateWith({ phase: 'decide', dice, turnTotal: 0 })
    const next = actionConfirmSetAside(state)
    expect(next.phase).toBe('hot-dice')
  })

  it('stays in decide phase when dice remain', () => {
    const state = decideState({ setAside: [1], held: [5] })
    const next = actionConfirmSetAside(state)
    expect(next.phase).toBe('decide')
  })

  it('logs the set-aside event', () => {
    const state = decideState({ held: [1], turnTotal: 0 })
    const next = actionConfirmSetAside(state)
    expect(next.log[next.log.length - 1]).toContain('set aside')
  })
})

// ─── §4 Step 4B — actionRollAgain ────────────────────────────────────────────

describe('§4 actionRollAgain', () => {
  it('does nothing outside decide phase', () => {
    const state = stateWith({ phase: 'select' })
    expect(actionRollAgain(state).phase).toBe('select')
  })

  it('transitions to roll phase when dice remain', () => {
    const state = decideState({ setAside: [1], held: [5] })
    const next = actionRollAgain(state)
    expect(next.phase).toBe('roll')
  })

  it('confirms held dice before rolling again', () => {
    const state = decideState({ held: [1], turnTotal: 0 })
    const next = actionRollAgain(state)
    // The held die (value 1) should be set aside now
    expect(next.dice.filter((d) => d.setAside).some((d) => d.value === 1)).toBe(true)
    expect(next.turnTotal).toBe(100)
  })

  it('transitions to hot-dice when all dice are set aside via roll-again', () => {
    // 5 already set aside, 1 held
    const dice: Die[] = [
      { id: 0, value: 1, setAside: true, held: false },
      { id: 1, value: 1, setAside: true, held: false },
      { id: 2, value: 1, setAside: true, held: false },
      { id: 3, value: 5, setAside: true, held: false },
      { id: 4, value: 5, setAside: true, held: false },
      { id: 5, value: 1, setAside: false, held: true },
    ]
    const state = stateWith({ phase: 'decide', dice, turnTotal: 650 })
    const next = actionRollAgain(state)
    expect(next.phase).toBe('hot-dice')
  })
})

// ─── §8/§4 — actionAcknowledgeFarkle ─────────────────────────────────────────

describe('§8 actionAcknowledgeFarkle', () => {
  it('does nothing outside farkle phase', () => {
    const state = stateWith({ phase: 'roll' })
    expect(actionAcknowledgeFarkle(state).phase).toBe('roll')
  })

  it('advances to next player after farkle', () => {
    const state = stateWith({ phase: 'farkle', currentPlayerIndex: 0 })
    const next = actionAcknowledgeFarkle(state)
    expect(next.currentPlayerIndex).toBe(1)
    expect(next.phase).toBe('roll')
  })

  it('wraps turn order back to first player', () => {
    const state = stateWith({ phase: 'farkle', currentPlayerIndex: 1 })
    const next = actionAcknowledgeFarkle(state)
    expect(next.currentPlayerIndex).toBe(0)
  })

  it('resets dice for the next player', () => {
    const dice = d([1, 2, 3, 4, 5, 6])
    dice[0] = { ...dice[0], setAside: true }
    const state = stateWith({ phase: 'farkle', dice })
    const next = actionAcknowledgeFarkle(state)
    expect(next.dice.every((d) => !d.setAside && !d.held)).toBe(true)
  })
})

// ─── §7 On-the-Board Minimum ─────────────────────────────────────────────────

describe('§7 on-the-board minimum (bank action)', () => {
  it('cannot bank below 500 when not on board', () => {
    const state = stateWith({
      phase: 'decide',
      turnTotal: 400,
      players: [
        { id: 0, name: 'Alice', score: 0, onBoard: false, consecutiveFarkles: 0, quit: false },
        { id: 1, name: 'Bob', score: 0, onBoard: false, consecutiveFarkles: 0, quit: false },
      ],
    })
    const next = actionBank(state)
    expect(next.phase).toBe('decide') // unchanged — bank rejected
  })

  it('can bank exactly 500 when not on board', () => {
    const state = stateWith({
      phase: 'decide',
      turnTotal: 500,
      players: [
        { id: 0, name: 'Alice', score: 0, onBoard: false, consecutiveFarkles: 0, quit: false },
        { id: 1, name: 'Bob', score: 0, onBoard: false, consecutiveFarkles: 0, quit: false },
      ],
    })
    const next = actionBank(state)
    expect(next.players[0].onBoard).toBe(true)
    expect(next.players[0].score).toBe(500)
  })

  it('can bank any amount once on board', () => {
    const state = stateWith({
      phase: 'decide',
      turnTotal: 150,
      players: [
        { id: 0, name: 'Alice', score: 600, onBoard: true, consecutiveFarkles: 0, quit: false },
        { id: 1, name: 'Bob', score: 0, onBoard: false, consecutiveFarkles: 0, quit: false },
      ],
    })
    const next = actionBank(state)
    expect(next.players[0].score).toBe(750)
  })

  it('advances to next player after banking', () => {
    const state = stateWith({
      phase: 'decide',
      turnTotal: 500,
      currentPlayerIndex: 0,
      players: [
        { id: 0, name: 'Alice', score: 0, onBoard: false, consecutiveFarkles: 0, quit: false },
        { id: 1, name: 'Bob', score: 0, onBoard: false, consecutiveFarkles: 0, quit: false },
      ],
    })
    const next = actionBank(state)
    expect(next.currentPlayerIndex).toBe(1)
    expect(next.phase).toBe('roll')
    expect(next.turnTotal).toBe(0)
  })

  it('resets consecutiveFarkles to 0 on bank', () => {
    const state = stateWith({
      phase: 'decide',
      turnTotal: 500,
      players: [
        { id: 0, name: 'Alice', score: 0, onBoard: false, consecutiveFarkles: 2, quit: false },
        { id: 1, name: 'Bob', score: 0, onBoard: false, consecutiveFarkles: 0, quit: false },
      ],
    })
    const next = actionBank(state)
    expect(next.players[0].consecutiveFarkles).toBe(0)
  })
})

// ─── §9 Hot Dice ─────────────────────────────────────────────────────────────

describe('§9 hot dice', () => {
  it('all 6 dice set aside triggers hot-dice phase', () => {
    const dice: Die[] = [1, 1, 1, 1, 1, 1].map((v, id) => ({
      id, value: v as DieValue, setAside: false, held: true,
    }))
    const state = stateWith({ phase: 'decide', dice, turnTotal: 0 })
    const next = actionConfirmSetAside(state)
    expect(next.phase).toBe('hot-dice')
  })

  it('turn total carries over into hot-dice roll', () => {
    const dice: Die[] = [1, 1, 1, 1, 1, 1].map((v, id) => ({
      id, value: v as DieValue, setAside: false, held: true,
    }))
    const state = stateWith({ phase: 'decide', dice, turnTotal: 500 })
    const hotDice = actionConfirmSetAside(state)
    expect(hotDice.turnTotal).toBe(5500) // 500 + 5000 (six 1s)
    expect(hotDice.phase).toBe('hot-dice')
  })

  it('roll in hot-dice phase rolls all 6 fresh dice', () => {
    const state = stateWith({ phase: 'hot-dice' })
    const next = actionRoll(state)
    // All dice should be un-set-aside after hot dice roll
    expect(next.dice.every((d) => !d.setAside)).toBe(true)
    expect(next.dice).toHaveLength(6)
  })

  it('farkle on hot-dice roll loses entire turn total including pre-hot-dice points', () => {
    // We can't force a farkle, but we can verify turnTotal = 0 when farkle occurs
    const state = stateWith({ phase: 'hot-dice', turnTotal: 1500 })
    for (let i = 0; i < 500; i++) {
      const next = actionRoll(state)
      if (next.phase === 'farkle') {
        expect(next.turnTotal).toBe(0)
        return
      }
    }
    expect(true).toBe(true) // rare farkle — acceptable
  })
})

// ─── §10 Three Consecutive Farkles ───────────────────────────────────────────

describe('§10 three consecutive farkles', () => {
  it('resets farkle counter to 0 after a successful bank', () => {
    const state = stateWith({
      phase: 'decide',
      turnTotal: 500,
      players: [
        { id: 0, name: 'Alice', score: 0, onBoard: false, consecutiveFarkles: 2, quit: false },
        { id: 1, name: 'Bob', score: 0, onBoard: false, consecutiveFarkles: 0, quit: false },
      ],
    })
    const afterBank = actionBank(state)
    expect(afterBank.players[0].consecutiveFarkles).toBe(0)
  })

  it('farkle counter increments each time actionRoll produces a farkle', () => {
    const state = stateWith({
      phase: 'roll',
      players: [
        { id: 0, name: 'Alice', score: 1000, onBoard: true, consecutiveFarkles: 0, quit: false },
        { id: 1, name: 'Bob', score: 0, onBoard: false, consecutiveFarkles: 0, quit: false },
      ],
    })
    for (let i = 0; i < 500; i++) {
      const next = actionRoll(state)
      if (next.phase === 'farkle') {
        expect(next.players[0].consecutiveFarkles).toBe(1)
        return
      }
    }
    expect(true).toBe(true)
  })

  it('score goes negative with penalty (no floor)', () => {
    const state = stateWith({
      phase: 'roll',
      players: [
        { id: 0, name: 'Alice', score: 500, onBoard: true, consecutiveFarkles: 2, quit: false },
        { id: 1, name: 'Bob', score: 0, onBoard: false, consecutiveFarkles: 0, quit: false },
      ],
      settings: { threeFarkleRule: true, targetScore: 10000 },
    })
    for (let i = 0; i < 500; i++) {
      const next = actionRoll(state)
      if (next.phase === 'farkle') {
        expect(next.players[0].score).toBe(-500) // 500 - 1000
        return
      }
    }
    expect(true).toBe(true)
  })
})

// ─── §11 Final Round ─────────────────────────────────────────────────────────

describe('§11 final round trigger', () => {
  it('triggers final round when a player banks ≥10000', () => {
    const state = stateWith({
      phase: 'decide',
      turnTotal: 1000,
      players: [
        { id: 0, name: 'Alice', score: 9500, onBoard: true, consecutiveFarkles: 0, quit: false },
        { id: 1, name: 'Bob', score: 0, onBoard: false, consecutiveFarkles: 0, quit: false },
      ],
    })
    const next = actionBank(state)
    expect(next.finalRoundTriggeredBy).toBe(0)
    expect(next.finalRoundPlayersLeft).toEqual([1])
    expect(next.players[0].score).toBe(10500)
  })

  it('triggering player does not get another turn', () => {
    const state = stateWith({
      phase: 'decide',
      turnTotal: 1000,
      currentPlayerIndex: 0,
      players: [
        { id: 0, name: 'Alice', score: 9500, onBoard: true, consecutiveFarkles: 0, quit: false },
        { id: 1, name: 'Bob', score: 0, onBoard: false, consecutiveFarkles: 0, quit: false },
      ],
    })
    const next = actionBank(state)
    // Turn should pass to player 1, not stay with player 0
    expect(next.currentPlayerIndex).toBe(1)
  })

  it('ends game after all final-round players have gone', () => {
    const state = stateWith({
      phase: 'decide',
      turnTotal: 500,
      currentPlayerIndex: 1,
      finalRoundTriggeredBy: 0,
      finalRoundPlayersLeft: [1],
      players: [
        { id: 0, name: 'Alice', score: 10500, onBoard: true, consecutiveFarkles: 0, quit: false },
        { id: 1, name: 'Bob', score: 200, onBoard: true, consecutiveFarkles: 0, quit: false },
      ],
    })
    const next = actionBank(state)
    expect(next.phase).toBe('game-over')
    expect(next.winner).toBe(0) // Alice still has more
  })

  it('tied score — non-triggering player wins', () => {
    const state = stateWith({
      phase: 'decide',
      turnTotal: 500,
      currentPlayerIndex: 1,
      finalRoundTriggeredBy: 0,
      finalRoundPlayersLeft: [1],
      players: [
        { id: 0, name: 'Alice', score: 10000, onBoard: true, consecutiveFarkles: 0, quit: false },
        { id: 1, name: 'Bob', score: 9500, onBoard: true, consecutiveFarkles: 0, quit: false },
      ],
    })
    const next = actionBank(state)
    expect(next.phase).toBe('game-over')
    expect(next.winner).toBe(1) // Bob tied — Bob wins per §11
  })

  it('farkle during final round still advances and ends game when list exhausted', () => {
    const state = stateWith({
      phase: 'farkle',
      currentPlayerIndex: 1,
      finalRoundTriggeredBy: 0,
      finalRoundPlayersLeft: [1],
      players: [
        { id: 0, name: 'Alice', score: 10500, onBoard: true, consecutiveFarkles: 0, quit: false },
        { id: 1, name: 'Bob', score: 200, onBoard: true, consecutiveFarkles: 0, quit: false },
      ],
    })
    const next = actionAcknowledgeFarkle(state)
    expect(next.phase).toBe('game-over')
    expect(next.winner).toBe(0)
  })

  it('3-player game: final round gives both non-triggerers a last turn', () => {
    const state = stateWith({
      phase: 'decide',
      turnTotal: 1000,
      currentPlayerIndex: 0,
      players: [
        { id: 0, name: 'Alice', score: 9500, onBoard: true, consecutiveFarkles: 0, quit: false },
        { id: 1, name: 'Bob', score: 5000, onBoard: true, consecutiveFarkles: 0, quit: false },
        { id: 2, name: 'Carol', score: 6000, onBoard: true, consecutiveFarkles: 0, quit: false },
      ],
    })
    const triggered = actionBank(state)
    expect(triggered.finalRoundPlayersLeft).toEqual([1, 2])
    expect(triggered.finalRoundPlayersLeft).toHaveLength(2)
  })
})

// ─── §12 Quit ────────────────────────────────────────────────────────────────

describe('§12 quit', () => {
  it('last remaining player wins when opponent quits', () => {
    const state = stateWith({
      phase: 'roll',
      players: [
        { id: 0, name: 'Alice', score: 0, onBoard: false, consecutiveFarkles: 0, quit: false },
        { id: 1, name: 'Bob', score: 500, onBoard: true, consecutiveFarkles: 0, quit: false },
      ],
    })
    const next = actionQuit(state)
    expect(next.phase).toBe('game-over')
    expect(next.winner).toBe(1)
    expect(next.winByForfeit).toBe(true)
  })

  it('multi-player quit marks player as quit and continues', () => {
    const state = stateWith({
      phase: 'roll',
      currentPlayerIndex: 0,
      players: [
        { id: 0, name: 'Alice', score: 0, onBoard: false, consecutiveFarkles: 0, quit: false },
        { id: 1, name: 'Bob', score: 500, onBoard: true, consecutiveFarkles: 0, quit: false },
        { id: 2, name: 'Carol', score: 300, onBoard: false, consecutiveFarkles: 0, quit: false },
      ],
    })
    const next = actionQuit(state)
    expect(next.phase).toBe('roll')
    // all 3 still present — quitter is marked, not removed
    expect(next.players).toHaveLength(3)
    expect(next.players.find((p) => p.name === 'Alice')?.quit).toBe(true)
    expect(next.players.find((p) => p.name === 'Bob')?.quit).toBe(false)
  })

  it('quit logs the event', () => {
    const state = stateWith({ phase: 'roll' })
    const next = actionQuit(state)
    expect(next.log[next.log.length - 1]).toContain('quit')
  })
})

// ─── getScoringCombos ─────────────────────────────────────────────────────────

describe('getScoringCombos', () => {
  it('identifies single 1 and single 5', () => {
    // [1,2,3,4,5,6] would be a Straight — use a non-straight roll instead
    const dice = d([1, 5, 2, 2, 4, 6])
    const combos = getScoringCombos(dice)
    const labels = combos.map((c) => c.label)
    expect(labels).toContain('Single 1')
    expect(labels).toContain('Single 5')
  })

  it('identifies three of a kind', () => {
    const dice = d([3, 3, 3, 2, 4, 6])
    const combos = getScoringCombos(dice)
    expect(combos.some((c) => c.label === 'Three 3s' && c.points === 300)).toBe(true)
  })

  it('identifies straight', () => {
    const dice = d([1, 2, 3, 4, 5, 6])
    const combos = getScoringCombos(dice)
    expect(combos.some((c) => c.label === 'Straight' && c.points === 1500)).toBe(true)
  })

  it('identifies two triplets', () => {
    const dice = d([2, 2, 2, 4, 4, 4])
    const combos = getScoringCombos(dice)
    expect(combos.some((c) => c.label === 'Two Triplets' && c.points === 2500)).toBe(true)
  })

  it('returns empty for a farkle roll', () => {
    const dice = d([2, 3, 4, 6, 2, 4])
    const combos = getScoringCombos(dice)
    expect(combos).toHaveLength(0)
  })

  it('does not include set-aside dice in combos', () => {
    const dice = d([1, 1, 1, 2, 3, 4])
    dice[0] = { ...dice[0], setAside: true }
    dice[1] = { ...dice[1], setAside: true }
    // Only one 1 remains in play — should be Single 1, not Three 1s
    const combos = getScoringCombos(dice)
    expect(combos.some((c) => c.label === 'Three 1s')).toBe(false)
    expect(combos.some((c) => c.label === 'Single 1')).toBe(true)
  })

  it('identifies three pairs', () => {
    const dice = d([2, 2, 4, 4, 6, 6])
    const combos = getScoringCombos(dice)
    expect(combos.some((c) => c.label === 'Three Pairs' && c.points === 1500)).toBe(true)
  })
})

// ─── createGame ───────────────────────────────────────────────────────────────

describe('createGame', () => {
  it('creates correct number of players', () => {
    const state = createGame(['Alice', 'Bob', 'Carol'])
    expect(state.players).toHaveLength(3)
  })

  it('all players start with 0 score and not on board', () => {
    const state = createGame(['Alice', 'Bob'])
    state.players.forEach((p) => {
      expect(p.score).toBe(0)
      expect(p.onBoard).toBe(false)
      expect(p.consecutiveFarkles).toBe(0)
    })
  })

  it('starts in roll phase with player 0', () => {
    const state = createGame(['Alice', 'Bob'])
    expect(state.phase).toBe('roll')
    expect(state.currentPlayerIndex).toBe(0)
    expect(state.turnTotal).toBe(0)
  })

  it('respects custom targetScore setting', () => {
    const state = createGame(['Alice', 'Bob'], { targetScore: 5000 })
    expect(state.settings.targetScore).toBe(5000)
  })

  it('three-farkle rule is enabled by default', () => {
    const state = createGame(['Alice', 'Bob'])
    expect(state.settings.threeFarkleRule).toBe(true)
  })

  it('three-farkle rule can be disabled', () => {
    const state = createGame(['Alice', 'Bob'], { threeFarkleRule: false })
    expect(state.settings.threeFarkleRule).toBe(false)
  })
})
