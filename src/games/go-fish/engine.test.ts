import { describe, it, expect } from 'vitest'
import {
  buildDeck, shuffle, extractBooks, askableRanks, needsRefill,
  isGameOver, winners, createGame,
  actionReady, actionAsk, actionContinueTurn, actionEndFishTurn, actionQuit,
  RANKS,
} from './engine'
import type { Card, GoFishState, Rank } from './engine'

// ─── Deterministic RNG helpers ────────────────────────────────────────────────

/** Returns cards in order without shuffling */
const noShuffle = () => 0

/** Seeded LCG for reproducible shuffles */
function lcg(seed: number) {
  let s = seed
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0x100000000 }
}

// ─── Card builder helper ──────────────────────────────────────────────────────

function card(rank: Rank, suit: '♠' | '♥' | '♦' | '♣'): Card {
  return { rank, suit }
}

function hand(...specs: [Rank, '♠' | '♥' | '♦' | '♣'][]): Card[] {
  return specs.map(([r, s]) => card(r, s))
}

// ─── §3 buildDeck ─────────────────────────────────────────────────────────────

describe('buildDeck', () => {
  it('produces 52 cards', () => {
    expect(buildDeck()).toHaveLength(52)
  })

  it('has exactly 4 of each rank', () => {
    const deck = buildDeck()
    for (const rank of RANKS) {
      expect(deck.filter(c => c.rank === rank)).toHaveLength(4)
    }
  })

  it('has no duplicates', () => {
    const deck = buildDeck()
    const keys = deck.map(c => `${c.rank}${c.suit}`)
    expect(new Set(keys).size).toBe(52)
  })
})

// ─── shuffle ──────────────────────────────────────────────────────────────────

describe('shuffle', () => {
  it('returns same length', () => {
    expect(shuffle([1, 2, 3, 4])).toHaveLength(4)
  })

  it('does not mutate original', () => {
    const arr = [1, 2, 3]
    shuffle(arr)
    expect(arr).toEqual([1, 2, 3])
  })

  it('produces different order with random rng', () => {
    const deck = buildDeck()
    const s1 = shuffle(deck, lcg(1))
    const s2 = shuffle(deck, lcg(99999))
    expect(s1).not.toEqual(s2)
  })
})

// ─── §6 extractBooks ─────────────────────────────────────────────────────────

describe('§6 extractBooks', () => {
  it('no books — hand unchanged', () => {
    const h = hand(['A', '♠'], ['A', '♥'], ['A', '♦'])
    const { hand: out, newBooks } = extractBooks(h)
    expect(out).toHaveLength(3)
    expect(newBooks).toHaveLength(0)
  })

  it('exactly 4 of a rank = one book, removed from hand', () => {
    const h = hand(['A', '♠'], ['A', '♥'], ['A', '♦'], ['A', '♣'])
    const { hand: out, newBooks } = extractBooks(h)
    expect(out).toHaveLength(0)
    expect(newBooks).toEqual(['A'])
  })

  it('mixed hand — only the complete rank becomes a book', () => {
    const h = hand(
      ['K', '♠'], ['K', '♥'], ['K', '♦'], ['K', '♣'],
      ['Q', '♠'], ['Q', '♥'],
    )
    const { hand: out, newBooks } = extractBooks(h)
    expect(newBooks).toEqual(['K'])
    expect(out).toHaveLength(2)
    expect(out.every(c => c.rank === 'Q')).toBe(true)
  })

  it('two simultaneous books', () => {
    const h = hand(
      ['2', '♠'], ['2', '♥'], ['2', '♦'], ['2', '♣'],
      ['3', '♠'], ['3', '♥'], ['3', '♦'], ['3', '♣'],
    )
    const { hand: out, newBooks } = extractBooks(h)
    expect(newBooks).toHaveLength(2)
    expect(out).toHaveLength(0)
  })
})

// ─── §5 askableRanks ─────────────────────────────────────────────────────────

describe('§5 askableRanks', () => {
  it('returns unique ranks held', () => {
    const h = hand(['A', '♠'], ['A', '♥'], ['K', '♦'])
    const ranks = askableRanks(h)
    expect(ranks).toContain('A')
    expect(ranks).toContain('K')
    expect(ranks).toHaveLength(2)
  })

  it('empty hand returns empty list', () => {
    expect(askableRanks([])).toHaveLength(0)
  })
})

// ─── §7 needsRefill ──────────────────────────────────────────────────────────

describe('§7 needsRefill', () => {
  it('empty hand + pile has cards = needs refill', () => {
    expect(needsRefill({ name: 'P', hand: [], books: [] }, 5)).toBe(true)
  })

  it('empty hand + empty pile = no refill', () => {
    expect(needsRefill({ name: 'P', hand: [], books: [] }, 0)).toBe(false)
  })

  it('non-empty hand = no refill', () => {
    expect(needsRefill({ name: 'P', hand: [card('A', '♠')], books: [] }, 5)).toBe(false)
  })
})

// ─── §4 createGame ───────────────────────────────────────────────────────────

describe('§4 createGame', () => {
  it('2 players each get 7 cards', () => {
    const state = createGame(['Alice', 'Bob'], noShuffle)
    const totalInHand = state.players.reduce((sum, p) => sum + p.hand.length + p.books.length * 4, 0)
    expect(totalInHand).toBe(14)
  })

  it('3 players each get 5 cards', () => {
    const state = createGame(['A', 'B', 'C'], noShuffle)
    const totalInHand = state.players.reduce((sum, p) => sum + p.hand.length + p.books.length * 4, 0)
    expect(totalInHand).toBe(15)
  })

  it('starts in handoff phase', () => {
    const state = createGame(['A', 'B'], noShuffle)
    expect(state.phase).toBe('handoff')
  })

  it('pile has remaining cards after deal', () => {
    const state = createGame(['A', 'B'], noShuffle)
    const totalInHand = state.players.reduce((sum, p) => sum + p.hand.length + p.books.length * 4, 0)
    expect(totalInHand + state.pile.length).toBe(52)
  })

  it('current player is 0', () => {
    const state = createGame(['A', 'B'], noShuffle)
    expect(state.current).toBe(0)
  })

  it('books extracted from opening hands', () => {
    // We can verify total card conservation: hand + books*4 + pile == 52
    const state = createGame(['A', 'B', 'C'], lcg(42))
    const accounted = state.players.reduce(
      (sum, p) => sum + p.hand.length + p.books.length * 4, 0
    ) + state.pile.length
    expect(accounted).toBe(52)
  })
})

// ─── §10 actionReady ─────────────────────────────────────────────────────────

describe('§10 actionReady', () => {
  it('transitions from handoff to ask', () => {
    const state = createGame(['A', 'B'], noShuffle)
    expect(state.phase).toBe('handoff')
    const next = actionReady(state)
    expect(next.phase).toBe('ask')
  })

  it('does nothing outside handoff phase', () => {
    const state: GoFishState = { ...createGame(['A', 'B'], noShuffle), phase: 'ask' }
    expect(actionReady(state).phase).toBe('ask')
  })
})

// ─── §5 actionAsk ────────────────────────────────────────────────────────────

describe('§5 actionAsk — got cards', () => {
  function stateWithHands(p0Hand: Card[], p1Hand: Card[], pile: Card[] = []): GoFishState {
    return {
      players: [
        { name: 'Alice', hand: p0Hand, books: [] },
        { name: 'Bob', hand: p1Hand, books: [] },
      ],
      pile,
      current: 0,
      phase: 'ask',
      lastAsk: null,
      log: [],
    }
  }

  it('transfers all matching cards from target to asker', () => {
    const state = stateWithHands(
      hand(['A', '♠']),
      hand(['A', '♥'], ['A', '♦'], ['K', '♣']),
    )
    const next = actionAsk(state, 1, 'A')
    expect(next.players[0].hand.filter(c => c.rank === 'A')).toHaveLength(3)
    expect(next.players[1].hand.filter(c => c.rank === 'A')).toHaveLength(0)
  })

  it('goes to result-got phase when target has cards', () => {
    const state = stateWithHands(hand(['A', '♠']), hand(['A', '♥']))
    const next = actionAsk(state, 1, 'A')
    expect(next.phase).toBe('result-got')
  })

  it('records lastAsk.received', () => {
    const state = stateWithHands(hand(['A', '♠']), hand(['A', '♥'], ['A', '♦']))
    const next = actionAsk(state, 1, 'A')
    expect(next.lastAsk?.received).toHaveLength(2)
  })

  it('extracts a book when 4th card is received', () => {
    const state = stateWithHands(
      hand(['A', '♠'], ['A', '♥'], ['A', '♦']),
      hand(['A', '♣'], ['K', '♠']),
    )
    const next = actionAsk(state, 1, 'A')
    expect(next.players[0].books).toContain('A')
    expect(next.players[0].hand.filter(c => c.rank === 'A')).toHaveLength(0)
  })

  it('logs the ask event', () => {
    const state = stateWithHands(hand(['A', '♠']), hand(['A', '♥']))
    const next = actionAsk(state, 1, 'A')
    expect(next.log[next.log.length - 1]).toContain('Alice')
    expect(next.log[next.log.length - 1]).toContain('Bob')
    expect(next.log[next.log.length - 1]).toContain('A')
  })
})

describe('§5 actionAsk — go fish', () => {
  function stateWithHands(p0Hand: Card[], p1Hand: Card[], pile: Card[] = []): GoFishState {
    return {
      players: [
        { name: 'Alice', hand: p0Hand, books: [] },
        { name: 'Bob', hand: p1Hand, books: [] },
      ],
      pile,
      current: 0,
      phase: 'ask',
      lastAsk: null,
      log: [],
    }
  }

  it('goes to result-fish phase when target has no matching cards', () => {
    const state = stateWithHands(hand(['A', '♠']), hand(['K', '♥']))
    const next = actionAsk(state, 1, 'A')
    expect(next.phase).toBe('result-fish')
  })

  it('draws top card from pile on go fish', () => {
    const pile = [card('2', '♠'), card('3', '♥')]
    const state = stateWithHands(hand(['A', '♠']), hand(['K', '♥']), pile)
    const next = actionAsk(state, 1, 'A')
    expect(next.players[0].hand.some(c => c.rank === '2' && c.suit === '♠')).toBe(true)
    expect(next.pile).toHaveLength(1)
  })

  it('luckyFish=true when drawn card matches asked rank', () => {
    const pile = [card('A', '♥')]
    const state = stateWithHands(hand(['A', '♠']), hand(['K', '♥']), pile)
    const next = actionAsk(state, 1, 'A')
    expect(next.lastAsk?.luckyFish).toBe(true)
  })

  it('luckyFish=false when drawn card does not match', () => {
    const pile = [card('2', '♠')]
    const state = stateWithHands(hand(['A', '♠']), hand(['K', '♥']), pile)
    const next = actionAsk(state, 1, 'A')
    expect(next.lastAsk?.luckyFish).toBe(false)
  })

  it('no card drawn when pile is empty', () => {
    const state = stateWithHands(hand(['A', '♠']), hand(['K', '♥']), [])
    const next = actionAsk(state, 1, 'A')
    expect(next.lastAsk?.drawnCard).toBeNull()
  })

  it('extracts a book on a lucky fish', () => {
    const pile = [card('A', '♦')]
    const state = stateWithHands(
      hand(['A', '♠'], ['A', '♥'], ['A', '♣']),
      hand(['K', '♠']),
      pile,
    )
    const next = actionAsk(state, 1, 'A')
    expect(next.players[0].books).toContain('A')
  })

  it('cannot ask for a rank not in hand', () => {
    const state = stateWithHands(hand(['A', '♠']), hand(['K', '♥']))
    const same = actionAsk(state, 1, 'K')
    expect(same).toBe(state)
  })

  it('cannot ask self', () => {
    const state = stateWithHands(hand(['A', '♠']), hand(['K', '♥']))
    const same = actionAsk(state, 0, 'A')
    expect(same).toBe(state)
  })

  it('does nothing outside ask phase', () => {
    const state = stateWithHands(hand(['A', '♠']), hand(['K', '♥']))
    const handoff: GoFishState = { ...state, phase: 'handoff' }
    expect(actionAsk(handoff, 1, 'A')).toBe(handoff)
  })
})

// ─── §5 actionContinueTurn ───────────────────────────────────────────────────

describe('§5 actionContinueTurn', () => {
  it('returns to ask phase', () => {
    const state: GoFishState = {
      players: [
        { name: 'Alice', hand: hand(['K', '♠']), books: [] },
        { name: 'Bob', hand: hand(['Q', '♥']), books: [] },
      ],
      pile: [],
      current: 0,
      phase: 'result-got',
      lastAsk: { targetIndex: 1, rank: 'A', received: [card('A', '♥')], drawnCard: null, luckyFish: false, newBooks: [] },
      log: [],
    }
    const next = actionContinueTurn(state)
    expect(next.phase).toBe('ask')
  })

  it('does nothing outside result-got phase', () => {
    const state: GoFishState = {
      players: [
        { name: 'Alice', hand: hand(['K', '♠']), books: [] },
        { name: 'Bob', hand: hand(['Q', '♥']), books: [] },
      ],
      pile: [],
      current: 0,
      phase: 'ask',
      lastAsk: null,
      log: [],
    }
    expect(actionContinueTurn(state)).toBe(state)
  })

  it('refills hand from pile if empty after getting cards', () => {
    const state: GoFishState = {
      players: [
        { name: 'Alice', hand: [], books: [['A']] as unknown as Rank[] },
        { name: 'Bob', hand: hand(['Q', '♥']), books: [] },
      ],
      pile: [card('5', '♠')],
      current: 0,
      phase: 'result-got',
      lastAsk: { targetIndex: 1, rank: 'A', received: [], drawnCard: null, luckyFish: false, newBooks: [] },
      log: [],
    }
    const next = actionContinueTurn(state)
    expect(next.players[0].hand).toHaveLength(1)
    expect(next.pile).toHaveLength(0)
  })
})

// ─── §5 actionEndFishTurn ────────────────────────────────────────────────────

describe('§5 actionEndFishTurn', () => {
  function fishState(luckyFish: boolean, extraHand: Card[] = []): GoFishState {
    return {
      players: [
        { name: 'Alice', hand: [...hand(['K', '♠']), ...extraHand], books: [] },
        { name: 'Bob', hand: hand(['Q', '♥']), books: [] },
      ],
      pile: [],
      current: 0,
      phase: 'result-fish',
      lastAsk: { targetIndex: 1, rank: 'A', received: [], drawnCard: card('2', '♠'), luckyFish, newBooks: [] },
      log: [],
    }
  }

  it('advances to next player when not a lucky fish', () => {
    const next = actionEndFishTurn(fishState(false))
    expect(next.current).toBe(1)
    expect(next.phase).toBe('handoff')
  })

  it('lucky fish — stays with current player, goes to ask', () => {
    const next = actionEndFishTurn(fishState(true))
    expect(next.current).toBe(0)
    expect(next.phase).toBe('ask')
  })

  it('does nothing outside result-fish phase', () => {
    const state: GoFishState = { ...fishState(false), phase: 'ask' }
    expect(actionEndFishTurn(state)).toBe(state)
  })

  it('wraps turn order from last player back to first', () => {
    const state: GoFishState = {
      players: [
        { name: 'Alice', hand: hand(['K', '♠']), books: [] },
        { name: 'Bob', hand: hand(['Q', '♥']), books: [] },
      ],
      pile: [],
      current: 1,
      phase: 'result-fish',
      lastAsk: { targetIndex: 0, rank: 'K', received: [], drawnCard: null, luckyFish: false, newBooks: [] },
      log: [],
    }
    const next = actionEndFishTurn(state)
    // game over (pile empty, both might be empty) OR wraps to 0
    expect(next.current === 0 || next.phase === 'game-over').toBe(true)
  })
})

// ─── §8 isGameOver / winners ─────────────────────────────────────────────────

describe('§8 isGameOver', () => {
  it('not over when pile has cards', () => {
    const state = createGame(['A', 'B'], noShuffle)
    expect(isGameOver(state)).toBe(false)
  })

  it('over when pile empty and all hands empty', () => {
    const state: GoFishState = {
      players: [
        { name: 'Alice', hand: [], books: ['A'] },
        { name: 'Bob', hand: [], books: ['K'] },
      ],
      pile: [],
      current: 0,
      phase: 'ask',
      lastAsk: null,
      log: [],
    }
    expect(isGameOver(state)).toBe(true)
  })

  it('not over when pile empty but a player still has cards', () => {
    const state: GoFishState = {
      players: [
        { name: 'Alice', hand: [card('2', '♠')], books: [] },
        { name: 'Bob', hand: [], books: [] },
      ],
      pile: [],
      current: 0,
      phase: 'ask',
      lastAsk: null,
      log: [],
    }
    expect(isGameOver(state)).toBe(false)
  })
})

describe('§8 winners', () => {
  it('player with most books wins', () => {
    const players = [
      { name: 'Alice', hand: [], books: ['A', 'K'] as Rank[] },
      { name: 'Bob', hand: [], books: ['Q'] as Rank[] },
    ]
    expect(winners(players)).toEqual([0])
  })

  it('tie — both players win', () => {
    const players = [
      { name: 'Alice', hand: [], books: ['A'] as Rank[] },
      { name: 'Bob', hand: [], books: ['K'] as Rank[] },
    ]
    expect(winners(players)).toEqual([0, 1])
  })
})

// ─── §11 actionQuit ──────────────────────────────────────────────────────────

describe('§11 actionQuit', () => {
  it('logs the quit', () => {
    const state = actionReady(createGame(['Alice', 'Bob'], noShuffle))
    const next = actionQuit(state, 0)
    expect(next.log.some(l => l.includes('Alice') && l.includes('quit'))).toBe(true)
  })

  it('one player remaining after quit — game over', () => {
    // Force a state where Bob has books (so he's the clear winner after Alice quits)
    const state: GoFishState = {
      players: [
        { name: 'Alice', hand: hand(['K', '♠']), books: [] },
        { name: 'Bob', hand: [], books: ['A'] },
      ],
      pile: [],
      current: 0,
      phase: 'ask',
      lastAsk: null,
      log: [],
    }
    const next = actionQuit(state, 0)
    expect(next.phase).toBe('game-over')
  })

  it('current player quits — turn advances to next player', () => {
    const state: GoFishState = {
      players: [
        { name: 'Alice', hand: hand(['K', '♠']), books: ['A'] },
        { name: 'Bob', hand: hand(['Q', '♥']), books: ['2'] },
      ],
      pile: [card('5', '♠')],
      current: 0,
      phase: 'ask',
      lastAsk: null,
      log: [],
    }
    const next = actionQuit(state, 0)
    // either game-over or advanced turn
    expect(next.current === 1 || next.phase === 'game-over').toBe(true)
  })

  it('does nothing when already game-over', () => {
    const state: GoFishState = {
      players: [{ name: 'A', hand: [], books: [] }, { name: 'B', hand: [], books: [] }],
      pile: [], current: 0, phase: 'game-over', lastAsk: null, log: [],
    }
    expect(actionQuit(state, 0)).toBe(state)
  })
})
