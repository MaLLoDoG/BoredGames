export type GameId =
  | 'checkers'
  | 'chess'
  | 'backgammon'
  | 'go-fish'
  | 'cribbage'
  | 'farkle'
  | 'shut-the-box'
  | 'jigsaw'

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
  {
    id: 'farkle',
    name: 'Farkle',
    emoji: '🎲',
    description: 'Press your luck with 6 dice. Bank your score or risk it all.',
    minPlayers: 2,
    maxPlayers: 6,
    category: 'dice',
    available: false,
  },
  {
    id: 'shut-the-box',
    name: 'Shut the Box',
    emoji: '📦',
    description: 'Roll dice and flip down numbered tiles. Shut them all to win.',
    minPlayers: 1,
    maxPlayers: 4,
    category: 'dice',
    available: false,
  },
  {
    id: 'checkers',
    name: 'Checkers',
    emoji: '🔴',
    description: 'Classic strategy on an 8×8 board. Jump your way to victory.',
    minPlayers: 2,
    maxPlayers: 2,
    category: 'board',
    available: false,
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
    id: 'go-fish',
    name: 'Go Fish',
    emoji: '🐟',
    description: 'Ask for cards, collect sets of four. Go fish!',
    minPlayers: 2,
    maxPlayers: 6,
    category: 'card',
    available: false,
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
    id: 'jigsaw',
    name: 'Jigsaw Puzzle',
    emoji: '🧩',
    description: 'Drag and drop pieces together. Relaxing solo or co-op fun.',
    minPlayers: 1,
    maxPlayers: 4,
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
