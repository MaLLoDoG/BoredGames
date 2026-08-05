import type { GameRules } from '../../types/rules'

const rules: GameRules = {
  gameId: 'shut-the-box',
  gameName: 'Shut the Box',
  emoji: '📦',
  summary: 'Roll the dice and flip down numbered tiles. Shut all nine tiles to win.',
  sections: [
    {
      title: 'Objective',
      bullets: [
        'Flip down all nine numbered tiles (1–9) to "shut the box" and score zero.',
        'In a multiplayer game, the player with the lowest score wins.',
      ],
    },
    {
      title: 'On Your Turn',
      bullets: [
        'Roll both dice (you can roll a single die instead once all open tiles sum to 6 or less).',
        'Choose any combination of open tiles that adds up to the dice total — then flip them down.',
        'Keep rolling until no valid combination exists (you bust) or all tiles are shut.',
      ],
    },
    {
      title: 'Scoring',
      bullets: [
        'When you bust, your score is the sum of any tiles still face-up.',
        'Shutting all nine tiles is a perfect score of zero.',
        'In multiplayer, each player takes a full turn and the lowest score wins.',
      ],
    },
    {
      title: 'Example',
      bullets: [
        'You roll a 9. Open tiles include 5 and 4, or just 9 — you choose which to flip.',
        'You roll a 3. Only tiles 1 and 2 are open and they sum to 3 — flip them both.',
        'Tiles are now all shut — you scored zero!',
      ],
    },
    {
      title: 'Tips',
      bullets: [
        'Flipping higher tiles early is usually better — they\'re harder to cover later.',
        'When the remaining tiles sum to 6 or less, switching to a single die reduces your bust risk.',
      ],
    },
  ],
}

export default rules
