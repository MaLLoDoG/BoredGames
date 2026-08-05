import type { GameRules } from '../../types/rules'

const rules: GameRules = {
  gameId: 'connect-four',
  gameName: 'Connect Four',
  emoji: '🟡',
  summary: 'Drop colored discs into a 7-column grid. First to connect four in a row wins.',
  sections: [
    {
      title: 'Objective',
      bullets: [
        'Be the first player to get four of your discs in a row — horizontally, vertically, or diagonally.',
      ],
    },
    {
      title: 'How to Play',
      bullets: [
        'Players take turns dropping one disc into any column that isn\'t full.',
        'Discs fall to the lowest open row in that column — gravity always applies.',
        'The board is 6 rows tall and 7 columns wide.',
        'Red goes first.',
      ],
    },
    {
      title: 'Winning',
      bullets: [
        'Connect four of your discs in a straight line — left-right, up-down, or diagonal.',
        'The winning four discs are highlighted when the game ends.',
        'If the board fills completely with no winner, the game is a draw.',
      ],
    },
    {
      title: 'Strategy Tips',
      bullets: [
        'The center column is the most powerful — control it early.',
        'Watch for diagonal threats — they\'re the easiest to miss.',
        'Don\'t just build your own line; block your opponent\'s.',
      ],
    },
  ],
}

export default rules
