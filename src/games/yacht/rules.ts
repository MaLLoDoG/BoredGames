import type { GameRules } from '../../types/rules'

const rules: GameRules = {
  gameId: 'yacht',
  gameName: 'Yacht',
  emoji: '⚀',
  summary: 'Roll 5 dice up to three times and fill your scorecard. The public-domain original behind Yahtzee.',
  sections: [
    {
      title: 'Objective',
      bullets: [
        'Fill all 12 scoring categories on your scorecard over 12 rounds.',
        'The player with the highest total score wins.',
      ],
    },
    {
      title: 'On Your Turn',
      bullets: [
        'Roll all 5 dice — this is roll 1.',
        'Tap any dice you want to keep (they turn yellow), then roll again — this is roll 2.',
        'Hold and re-roll one more time if you like — this is roll 3.',
        'After any roll you may tap "Score Now" to skip remaining rolls.',
        'After your final roll, tap a category on the scorecard to record your score.',
      ],
    },
    {
      title: 'Upper Section (Ones through Sixes)',
      bullets: [
        'Score the sum of all dice showing that face value.',
        'Example: three 4s in Fours = 12 points.',
        'You can always score 0 in any category you can\'t fill — but choose wisely!',
      ],
    },
    {
      title: 'Lower Section',
      bullets: [
        'Full House — three of one value and two of another (not five of a kind). Scores the sum of all 5 dice.',
        'Four of a Kind — at least four dice the same. Scores the sum of all 5 dice.',
        'Little Straight — 1-2-3-4-5 in any order. Scores 30.',
        'Big Straight — 2-3-4-5-6 in any order. Scores 30.',
        'Choice — any combination. Scores the sum of all 5 dice.',
        'Yacht — all 5 dice the same. Scores 50.',
      ],
    },
    {
      title: 'Scoring Rules',
      bullets: [
        'Each category can only be scored once.',
        'If your dice don\'t meet the requirement, you score 0 — the category is still used up.',
        'The scorecard shows your potential score for each empty category based on your current dice.',
        'Five of a kind satisfies Four of a Kind but NOT Full House.',
      ],
    },
    {
      title: 'Winning',
      bullets: [
        'The game lasts exactly 12 rounds — one round per category.',
        'After all players have filled every category, the highest score wins.',
        'Ties are allowed — all tied players share the win.',
      ],
    },
  ],
}

export default rules
