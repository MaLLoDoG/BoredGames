import type { GameRules } from '../../types/rules';

const rules: GameRules = {
  gameId: 'checkers',
  gameName: 'Checkers',
  emoji: '🔴',
  summary: 'Classic 8×8 strategy — jump your opponent\'s pieces and leave them with no moves to win.',
  sections: [
    {
      title: 'Overview',
      bullets: [
        '2 players: Red and Black. Red moves first.',
        'Win by capturing all your opponent\'s pieces, or leaving them with no legal moves.',
      ],
    },
    {
      title: 'The Board',
      bullets: [
        'Only the dark squares are used.',
        'Red starts on the bottom three rows; Black starts on the top three rows.',
        'Each player starts with 12 pieces.',
      ],
    },
    {
      title: 'Moving',
      bullets: [
        'Men (normal pieces) move diagonally forward one square.',
        'Kings may move diagonally in any of the four diagonal directions.',
      ],
    },
    {
      title: 'Capturing',
      bullets: [
        'Jump diagonally over an adjacent enemy piece into the empty square beyond.',
        'Captures are mandatory — if you can jump, you must.',
        'Multi-jump chains: if you can jump again from your landing square, you must keep jumping.',
        'All captured pieces are removed at the end of your full turn.',
      ],
    },
    {
      title: 'Kinging',
      bullets: [
        'A man reaching the far row is crowned a King (shown with ♛).',
        'Kings move and capture in all four diagonal directions.',
        'Promotion ends the turn even if another capture is available.',
      ],
    },
    {
      title: 'Draws',
      bullets: [
        'Draw by agreement: either player may offer, the other may accept.',
        'Draw by repetition: the same position occurs three times.',
        '40-move rule: 40 moves with no capture.',
      ],
    },
  ],
};

export { rules as checkersRules };
export default rules;
