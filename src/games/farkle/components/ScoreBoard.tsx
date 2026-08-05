import type { PlayerState } from '../engine'

interface ScoreBoardProps {
  players: PlayerState[]
  currentPlayerIndex: number
  turnTotal: number
  finalRoundTriggeredBy: number | null
  threeFarkleRule: boolean
}

export default function ScoreBoard({
  players,
  currentPlayerIndex,
  turnTotal,
  finalRoundTriggeredBy,
  threeFarkleRule,
}: ScoreBoardProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      {players.map((player) => {
        const isCurrent = player.id === currentPlayerIndex
        return (
          <div
            key={player.id}
            className={`
              rounded-xl p-3 border text-center transition-all
              ${isCurrent
                ? 'bg-yellow-400/10 border-yellow-400 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-400'}
            `}
          >
            <div className={`text-xs font-semibold uppercase tracking-wide mb-1 truncate
              ${isCurrent ? 'text-yellow-400' : 'text-slate-500'}`}>
              {isCurrent ? '▶ ' : ''}{player.name}
            </div>
            <div className={`text-2xl font-bold ${isCurrent ? 'text-white' : 'text-slate-300'}`}>
              {player.score.toLocaleString()}
            </div>
            {isCurrent && turnTotal > 0 && (
              <div className="text-xs text-yellow-300 mt-0.5">
                +{turnTotal.toLocaleString()} at risk
              </div>
            )}
            <div className="flex justify-center gap-1 mt-1 flex-wrap">
              {!player.onBoard && (
                <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full">
                  not on board
                </span>
              )}
              {finalRoundTriggeredBy === player.id && (
                <span className="text-[10px] bg-yellow-600 text-yellow-100 px-1.5 py-0.5 rounded-full">
                  🎯 triggered
                </span>
              )}
              {threeFarkleRule && player.consecutiveFarkles > 0 && (
                <span className="text-[10px] bg-red-900 text-red-300 px-1.5 py-0.5 rounded-full">
                  💀 {player.consecutiveFarkles}/3
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
