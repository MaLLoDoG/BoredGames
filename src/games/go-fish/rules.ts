import type { GameRules } from '../../types/rules'

const rules: GameRules = {
  gameId: 'go-fish',
  gameName: 'Go Fish',
  emoji: '🐟',
  summary: 'Ask other players for cards to collect sets of four. The player with the most sets wins.',
  sections: [
    {
      title: 'Objective',
      bullets: [
        'Collect the most "books" — a book is all four cards of the same rank (e.g. all four 7s).',
      ],
    },
    {
      title: 'Setup',
      bullets: [
        'With 2 players, each player is dealt 7 cards.',
        'With 3–6 players, each player gets 5 cards.',
        'The remaining cards form the draw pile face-down in the middle.',
        'Any books already in your opening hand are laid down immediately.',
      ],
    },
    {
      title: 'On Your Turn',
      bullets: [
        'Choose any rank you currently hold at least one of.',
        'Ask any other player: "Do you have any [rank]s?"',
        'If they do, they hand over all their cards of that rank and you take another turn.',
        'If they don\'t, they say "Go Fish!" and you draw the top card from the pile.',
        'If the card you drew matches what you asked for (lucky fish!), you take another turn.',
        'Otherwise your turn ends and play passes to the next player.',
      ],
    },
    {
      title: 'Books',
      bullets: [
        'Whenever you collect all four cards of any rank, lay them face-up as a completed book.',
        'This can happen when you receive cards from another player or draw from the pile.',
      ],
    },
    {
      title: 'Empty Hands',
      bullets: [
        'If your hand runs out, draw one card from the pile before continuing.',
        'If the pile is also empty, you sit out for the rest of the game.',
        'You cannot be asked for cards if your hand is empty.',
      ],
    },
    {
      title: 'Winning',
      bullets: [
        'The game ends when the draw pile is gone and all hands are empty.',
        'The player with the most books wins.',
        'Ties are allowed — all tied players share the win.',
      ],
    },
    {
      title: 'Privacy (Pass & Play)',
      bullets: [
        'Before each turn, a cover screen appears — pass the device to that player.',
        'Tap "I\'m Ready" only when other players are looking away.',
        'Your hand is hidden until you tap ready — just like holding real cards.',
      ],
    },
  ],
}

export default rules
