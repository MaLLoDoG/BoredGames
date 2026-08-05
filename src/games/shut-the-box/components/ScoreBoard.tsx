import type { PlayerResult } from '../engine'

interface ScoreBoardProps {
  players: PlayerResult[]
  currentPlayerIndex: number
}

export default function ScoreBoard({ players, currentPlayerIndex }: ScoreBoardProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {players.map((player) => {
        const isCurrent = player.id === currentPlayerIndex
        return (
          <div
            key={player.id}
            className={`
              rounded-xl p-3 border text-center transition-all
              ${isCurrent
                ? 'bg-yellow-400/10 border-yellow-400'
                : 'bg-slate-800 border-slate-700'}
            `}
          >
            <div className={`text-xs font-semibold uppercase tracking-wide mb-1 truncate
              ${isCurrent ? 'text-yellow-400' : 'text-slate-500'}`}>
              {isCurrent ? '▶ ' : ''}{player.name}
            </div>
            <div className={`text-2xl font-bold ${isCurrent ? 'text-white' : 'text-slate-400'}`}>
              {player.score === null ? '—' : player.score === 0 ? '🎉 0' : player.score}
            </div>
          </div>
        )
      })}
    </div>
  )
}
