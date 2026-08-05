import type { GameRules } from '../../types/rules'

const rules: GameRules = {
  gameId: 'farkle',
  gameName: 'Farkle',
  emoji: '🎲',
  summary: 'Roll six dice, set aside scoring combinations, and bank your points — but roll a Farkle and you lose everything.',
  sections: [
    {
      title: 'Objective',
      bullets: [
        'Be the first player to reach 10,000 points and survive the final round.',
      ],
    },
    {
      title: 'On Your Turn',
      bullets: [
        'Roll all 6 dice.',
        'Set aside at least one scoring die or combo from the roll.',
        'Choose to bank your points (add them to your total and end your turn) or roll the remaining dice again.',
        'If all 6 dice are set aside, you get "hot dice" — roll all 6 again and keep accumulating.',
      ],
    },
    {
      title: 'Scoring',
      bullets: [
        'Single 1 = 100 points.',
        'Single 5 = 50 points.',
        'Three of a kind = the face value × 100 (e.g. three 4s = 400). Three 1s = 1,000.',
        'Four of a kind = 3× the three-of-a-kind value.',
        'Five of a kind = 4× the three-of-a-kind value.',
        'Six of a kind = 5× the three-of-a-kind value. Six 1s = 5,000.',
        'Straight (1–2–3–4–5–6) = 1,500.',
        'Three pairs (e.g. 2–2, 4–4, 6–6) = 1,500.',
        'Four of a kind + a pair = 1,500.',
        'Two triplets (e.g. 2–2–2, 5–5–5) = 2,500.',
      ],
    },
    {
      title: 'Farkle!',
      bullets: [
        'If none of your rolled dice score, that\'s a Farkle.',
        'You lose all points accumulated this turn.',
        'Three Farkles in a row costs you 1,000 points from your total (can go negative).',
      ],
    },
    {
      title: 'Getting on the Board',
      bullets: [
        'You must bank at least 500 points in a single turn before your score starts counting.',
        'Until then, you can\'t bank below 500 — you must keep rolling.',
      ],
    },
    {
      title: 'Winning',
      bullets: [
        'When any player banks 10,000 or more, everyone else gets exactly one final turn.',
        'The player with the highest score after those final turns wins.',
        'Ties go to the non-triggering player — they had to work harder.',
      ],
    },
  ],
}

export default rules
