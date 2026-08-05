// Go Fish engine — all functions are pure (no side-effects, no randomness injected externally)
// Every function cites the RULES.md section it implements.

export const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'] as const
export const SUITS = ['♠','♥','♦','♣'] as const

export type Rank = typeof RANKS[number]
export type Suit = typeof SUITS[number]

export interface Card {
  rank: Rank
  suit: Suit
}

// §10
export type Phase =
  | 'handoff'
  | 'ask'
  | 'result-got'
  | 'result-fish'
  | 'game-over'

export interface Player {
  name: string
  hand: Card[]
  books: Rank[]
}

export interface GoFishState {
  players: Player[]
  pile: Card[]
  current: number          // index of active player
  phase: Phase
  // populated during result phases:
  lastAsk: {
    targetIndex: number
    rank: Rank
    received: Card[]       // cards handed over (empty = go fish)
    drawnCard: Card | null // card drawn from pile (null = pile was empty)
    luckyFish: boolean     // drawn card matched the asked rank
  } | null
  log: string[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** §3 — build a full 52-card deck */
export function buildDeck(): Card[] {
  const deck: Card[] = []
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      deck.push({ rank, suit })
    }
  }
  return deck
}

/** Fisher-Yates shuffle — accepts an injectable RNG for deterministic tests */
export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** §6 — extract any completed books from a hand, return updated hand + new book ranks */
export function extractBooks(hand: Card[]): { hand: Card[]; newBooks: Rank[] } {
  const newBooks: Rank[] = []
  const remaining: Card[] = []
  for (const rank of RANKS) {
    const matching = hand.filter(c => c.rank === rank)
    if (matching.length === 4) {
      newBooks.push(rank)
    } else {
      remaining.push(...matching)
    }
  }
  return { hand: remaining, newBooks }
}

/** §5 Step 1 — ranks a player is allowed to ask for (ranks they hold ≥1 of) */
export function askableRanks(hand: Card[]): Rank[] {
  const seen = new Set<Rank>()
  for (const c of hand) seen.add(c.rank)
  return RANKS.filter(r => seen.has(r))
}

/** §7 — true when a player has no cards and should draw to refill */
export function needsRefill(player: Player, pileSize: number): boolean {
  return player.hand.length === 0 && pileSize > 0
}

/** §8 — game is over when pile is empty and all hands are empty */
export function isGameOver(state: GoFishState): boolean {
  if (state.pile.length > 0) return false
  return state.players.every(p => p.hand.length === 0)
}

/** §8 — find winners (most books; ties allowed) */
export function winners(players: Player[]): number[] {
  const max = Math.max(...players.map(p => p.books.length))
  return players.map((p, i) => (p.books.length === max ? i : -1)).filter(i => i !== -1)
}

// ─── State creators ───────────────────────────────────────────────────────────

/** §4 — deal a new game */
export function createGame(
  playerNames: string[],
  rng: () => number = Math.random
): GoFishState {
  const deck = shuffle(buildDeck(), rng)
  // §4 — hand size depends on player count
  const handSize = playerNames.length === 2 ? 7 : 5
  const players: Player[] = playerNames.map((name, i) => {
    const hand = deck.slice(i * handSize, (i + 1) * handSize)
    return { name, hand, books: [] }
  })
  let pile = deck.slice(playerNames.length * handSize)

  // §4 — extract any books already in opening hands
  for (const player of players) {
    const { hand: newHand, newBooks } = extractBooks(player.hand)
    player.hand = newHand
    player.books.push(...newBooks)
  }

  // §7 — refill any player whose opening hand is empty after book extraction
  for (const player of players) {
    while (player.hand.length === 0 && pile.length > 0) {
      player.hand.push(pile.shift()!)
    }
  }

  return {
    players,
    pile,
    current: 0,
    phase: 'handoff',
    lastAsk: null,
    log: ['Game started — pass the device to ' + playerNames[0] + '!'],
  }
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/** §10 — active player tapped "I'm Ready"; reveal their hand → ask phase */
export function actionReady(state: GoFishState): GoFishState {
  if (state.phase !== 'handoff') return state
  return { ...state, phase: 'ask' }
}

/** §5 — active player asks target for a rank */
export function actionAsk(
  state: GoFishState,
  targetIndex: number,
  rank: Rank
): GoFishState {
  if (state.phase !== 'ask') return state

  const active = state.players[state.current]

  // §5 Step 1 — must hold at least one of the asked rank
  if (!active.hand.some(c => c.rank === rank)) return state
  // target must be a different player
  if (targetIndex === state.current) return state
  // target index must be in range
  if (targetIndex < 0 || targetIndex >= state.players.length) return state

  const players = state.players.map(p => ({ ...p, hand: [...p.hand], books: [...p.books] }))
  const target = players[targetIndex]
  const log = [...state.log]

  // §5 Step 2a / 2b — does target have any of that rank?
  const received = target.hand.filter(c => c.rank === rank)
  target.hand = target.hand.filter(c => c.rank !== rank)

  let pile = [...state.pile]

  if (received.length > 0) {
    // §5 Step 2a — got cards
    players[state.current].hand.push(...received)

    // §6 — check for book
    const { hand: newHand, newBooks } = extractBooks(players[state.current].hand)
    players[state.current].hand = newHand
    players[state.current].books.push(...newBooks)

    const bookMsg = newBooks.length > 0 ? ` 📚 Book of ${newBooks.join(', ')}!` : ''
    log.push(`${active.name} asked ${target.name} for ${rank}s — got ${received.length} card${received.length > 1 ? 's' : ''}!${bookMsg}`)

    return {
      ...state,
      players,
      pile,
      phase: 'result-got',
      lastAsk: { targetIndex, rank, received, drawnCard: null, luckyFish: false },
      log,
    }
  }

  // §5 Step 2b — Go Fish!
  const drawnCard = pile.length > 0 ? pile[0] : null
  pile = pile.slice(1)

  if (drawnCard) {
    players[state.current].hand.push(drawnCard)
  }

  // §6 — check for book after drawing
  const { hand: newHand, newBooks } = extractBooks(players[state.current].hand)
  players[state.current].hand = newHand
  players[state.current].books.push(...newBooks)

  const luckyFish = drawnCard !== null && drawnCard.rank === rank
  const bookMsg = newBooks.length > 0 ? ` 📚 Book of ${newBooks.join(', ')}!` : ''
  const fishMsg = drawnCard
    ? (luckyFish ? ` Lucky fish — drew a ${drawnCard.rank}!${bookMsg}` : ` Drew a ${drawnCard.rank}.`)
    : ' Pile is empty — no card drawn.'

  log.push(`${active.name} asked ${target.name} for ${rank}s — Go Fish!${fishMsg}`)

  return {
    ...state,
    players,
    pile,
    phase: 'result-fish',
    lastAsk: { targetIndex, rank, received: [], drawnCard, luckyFish },
    log,
  }
}

/** Advance turn: move to next eligible player, show handoff screen */
function advanceTurn(state: GoFishState): GoFishState {
  const total = state.players.length
  let next = (state.current + 1) % total
  // skip players with empty hands when pile is also empty (§7)
  let checked = 0
  while (
    state.players[next].hand.length === 0 &&
    state.pile.length === 0 &&
    checked < total
  ) {
    next = (next + 1) % total
    checked++
  }

  // §8 — check game over
  const nextState = { ...state, current: next }
  if (isGameOver(nextState)) {
    const winnerIndices = winners(state.players)
    const winnerNames = winnerIndices.map(i => state.players[i].name).join(' & ')
    return {
      ...nextState,
      phase: 'game-over',
      log: [...state.log, `Game over! ${winnerNames} win${winnerIndices.length === 1 ? 's' : ''}!`],
    }
  }

  return {
    ...nextState,
    phase: 'handoff',
    lastAsk: null,
    log: [...state.log, `Pass the device to ${state.players[next].name}!`],
  }
}

/** §5 Step 2a — active player acknowledges they got cards; take another turn */
export function actionContinueTurn(state: GoFishState): GoFishState {
  if (state.phase !== 'result-got') return state
  // §7 — refill hand if empty
  const players = state.players.map(p => ({ ...p, hand: [...p.hand], books: [...p.books] }))
  let pile = [...state.pile]
  if (players[state.current].hand.length === 0 && pile.length > 0) {
    players[state.current].hand.push(pile.shift()!)
  }
  // if hand still empty (pile exhausted), check game over
  const nextState = { ...state, players, pile }
  if (isGameOver(nextState)) {
    const winnerIndices = winners(players)
    const winnerNames = winnerIndices.map(i => players[i].name).join(' & ')
    return {
      ...nextState,
      phase: 'game-over',
      log: [...state.log, `Game over! ${winnerNames} win${winnerIndices.length === 1 ? 's' : ''}!`],
    }
  }
  return { ...nextState, phase: 'ask', lastAsk: null }
}

/** §5 Step 2b — active player acknowledges the fish result; end or continue turn */
export function actionEndFishTurn(state: GoFishState): GoFishState {
  if (state.phase !== 'result-fish') return state
  if (state.lastAsk?.luckyFish) {
    // §5 Step 2b — lucky fish: take another turn
    return actionContinueTurn({ ...state, phase: 'result-got' })
  }
  return advanceTurn(state)
}

/** §11 — any player can quit; if only one remains they win */
export function actionQuit(state: GoFishState, playerIndex: number): GoFishState {
  if (state.phase === 'game-over') return state
  const players = state.players.map(p => ({ ...p, hand: [...p.hand], books: [...p.books] }))
  // remove quitter's hand (they forfeit their books too? No — books already scored stay)
  players[playerIndex].hand = []
  const log = [...state.log, `${state.players[playerIndex].name} quit.`]

  const activePlayers = players.filter(p => p.books.length > 0 || p.hand.length > 0)
  if (activePlayers.length <= 1) {
    const winnerIndices = winners(players)
    const winnerNames = winnerIndices.map(i => players[i].name).join(' & ')
    return {
      ...state,
      players,
      phase: 'game-over',
      log: [...log, `Game over! ${winnerNames} win${winnerIndices.length === 1 ? 's' : ''}!`],
    }
  }

  // if the quitter was the current player, advance
  if (playerIndex === state.current) {
    return advanceTurn({ ...state, players, log })
  }
  return { ...state, players, log }
}
