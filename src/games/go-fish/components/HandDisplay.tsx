import type { Card, Rank } from '../engine'

interface HandDisplayProps {
  hand: Card[]
  selectable?: boolean
  selectedRank?: Rank | null
  onSelectRank?: (rank: Rank) => void
}

const SUIT_COLOR: Record<string, string> = {
  '♠': 'text-slate-900',
  '♣': 'text-slate-900',
  '♥': 'text-red-600',
  '♦': 'text-red-600',
}

export default function HandDisplay({ hand, selectable = false, selectedRank = null, onSelectRank }: HandDisplayProps) {
  if (hand.length === 0) {
    return <p className="text-slate-500 italic text-sm text-center">No cards in hand</p>
  }

  // group by rank for display
  const byRank = new Map<Rank, Card[]>()
  for (const card of hand) {
    const group = byRank.get(card.rank) ?? []
    group.push(card)
    byRank.set(card.rank, group)
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {Array.from(byRank.entries()).map(([rank, cards]) => {
        const isSelected = selectedRank === rank
        const suit = cards[0].suit
        const suitColor = SUIT_COLOR[suit] ?? 'text-slate-900'
        return (
          <button
            key={rank}
            disabled={!selectable}
            onClick={() => onSelectRank?.(rank)}
            className={`
              relative flex flex-col items-center justify-between
              w-14 h-20 rounded-lg border-2 font-bold text-sm
              transition-all duration-150
              ${selectable ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'}
              ${isSelected
                ? 'bg-yellow-300 border-yellow-500 shadow-lg shadow-yellow-400/50 scale-105'
                : 'bg-white border-slate-300 hover:border-slate-400'
              }
            `}
          >
            {/* Count badge */}
            {cards.length > 1 && (
              <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cards.length}
              </span>
            )}
            <span className={`text-xs font-bold self-start pl-1 pt-0.5 ${suitColor}`}>{rank}</span>
            <span className={`text-2xl ${suitColor}`}>{suit}</span>
            <span className={`text-xs font-bold self-end pr-1 pb-0.5 rotate-180 ${suitColor}`}>{rank}</span>
          </button>
        )
      })}
    </div>
  )
}
