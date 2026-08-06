export type GameId =
  | 'checkers'
  | 'chess'
  | 'backgammon'
  | 'go-fish'
  | 'cribbage'
  | 'farkle'
  | 'shut-the-box'
  | 'jigsaw'
  | 'yacht'
  | 'solitaire'
  | 'connect-four'
  | 'gin-rummy'
  | 'mancala'
  | 'hearts'
  | 'spades'
  | 'battleship'

export interface GameDefinition {
  id: GameId
  name: string
  emoji: string
  description: string
  minPlayers: number
  maxPlayers: number
  category: 'board' | 'card' | 'dice' | 'puzzle'
  available: boolean
}

export const GAMES: GameDefinition[] = [
  // ── Dice ────────────────────────────────────────────────────────────────────
  {
    id: 'farkle',
    name: 'Farkle',
    emoji: '🎲',
    description: 'Press your luck with 6 dice. Bank your score or risk it all.',
    minPlayers: 1,
    maxPlayers: 6,
    category: 'dice',
    available: true,
  },
  {
    id: 'shut-the-box',
    name: 'Shut the Box',
    emoji: '📦',
    description: 'Roll dice and flip down numbered tiles. Shut them all to win.',
    minPlayers: 1,
    maxPlayers: 4,
    category: 'dice',
    available: true,
  },
  {
    id: 'yacht',
    name: 'Yacht',
    emoji: '⚀',
    description: 'Roll 5 dice up to three times and fill your scorecard. The public domain original behind Yahtzee.',
    minPlayers: 1,
    maxPlayers: 6,
    category: 'dice',
    available: true,
  },

  // ── Board ────────────────────────────────────────────────────────────────────
  {
    id: 'checkers',
    name: 'Checkers',
    emoji: '🔴',
    description: 'Classic strategy on an 8×8 board. Jump your way to victory.',
    minPlayers: 2,
    maxPlayers: 2,
    category: 'board',
    available: true,
  },
  {
    id: 'chess',
    name: 'Chess',
    emoji: '♟️',
    description: 'The ultimate strategy game. Checkmate your opponent.',
    minPlayers: 2,
    maxPlayers: 2,
    category: 'board',
    available: false,
  },
  {
    id: 'backgammon',
    name: 'Backgammon',
    emoji: '🎯',
    description: 'Race your pieces home using dice rolls and strategy.',
    minPlayers: 2,
    maxPlayers: 2,
    category: 'board',
    available: false,
  },
  {
    id: 'connect-four',
    name: 'Connect Four',
    emoji: '🟡',
    description: 'Drop colored discs and be the first to connect four in a row.',
    minPlayers: 2,
    maxPlayers: 2,
    category: 'board',
    available: true,
  },
  {
    id: 'mancala',
    name: 'Mancala',
    emoji: '🪨',
    description: 'Scoop and sow stones around the board. Capture the most to win.',
    minPlayers: 2,
    maxPlayers: 2,
    category: 'board',
    available: false,
  },
  {
    id: 'battleship',
    name: 'Battleship',
    emoji: '🚢',
    description: 'Hide your fleet and hunt your opponent\'s ships on a hidden grid.',
    minPlayers: 2,
    maxPlayers: 2,
    category: 'board',
    available: false,
  },

  // ── Card ─────────────────────────────────────────────────────────────────────
  {
    id: 'go-fish',
    name: 'Go Fish',
    emoji: '🐟',
    description: 'Ask for cards, collect sets of four. Go fish!',
    minPlayers: 2,
    maxPlayers: 6,
    category: 'card',
    available: true,
  },
  {
    id: 'cribbage',
    name: 'Cribbage',
    emoji: '🃏',
    description: 'Score 15s, pairs, and runs on the classic pegging board.',
    minPlayers: 2,
    maxPlayers: 3,
    category: 'card',
    available: false,
  },
  {
    id: 'gin-rummy',
    name: 'Gin Rummy',
    emoji: '🥃',
    description: 'Draw and discard to form runs and sets. Knock when you\'re ready.',
    minPlayers: 2,
    maxPlayers: 4,
    category: 'card',
    available: false,
  },
  {
    id: 'hearts',
    name: 'Hearts',
    emoji: '♥️',
    description: 'Avoid taking hearts and the queen of spades in this trick-taking classic.',
    minPlayers: 4,
    maxPlayers: 4,
    category: 'card',
    available: false,
  },
  {
    id: 'spades',
    name: 'Spades',
    emoji: '♠️',
    description: 'Bid your tricks and make your contract. Spades are always trump.',
    minPlayers: 4,
    maxPlayers: 4,
    category: 'card',
    available: false,
  },

  // ── Puzzle ───────────────────────────────────────────────────────────────────
  {
    id: 'jigsaw',
    name: 'Jigsaw Puzzle',
    emoji: '🧩',
    description: 'Drag and drop pieces together. Relaxing solo or co-op fun.',
    minPlayers: 1,
    maxPlayers: 4,
    category: 'puzzle',
    available: false,
  },
  {
    id: 'solitaire',
    name: 'Solitaire',
    emoji: '🂡',
    description: 'The classic Klondike card game. Move all cards to the foundations.',
    minPlayers: 1,
    maxPlayers: 1,
    category: 'puzzle',
    available: false,
  },
]

export const CATEGORY_LABELS: Record<GameDefinition['category'], string> = {
  board: 'Board Games',
  card: 'Card Games',
  dice: 'Dice Games',
  puzzle: 'Puzzles',
}
