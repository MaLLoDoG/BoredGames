import type { GameDefinition } from '../types/games'

const CATEGORY_COLORS: Record<GameDefinition['category'], string> = {
  board: 'bg-blue-900/40 border-blue-700/50 text-blue-300',
  card: 'bg-purple-900/40 border-purple-700/50 text-purple-300',
  dice: 'bg-green-900/40 border-green-700/50 text-green-300',
  puzzle: 'bg-orange-900/40 border-orange-700/50 text-orange-300',
}

const CATEGORY_BADGE: Record<GameDefinition['category'], string> = {
  board: 'bg-blue-800 text-blue-200',
  card: 'bg-purple-800 text-purple-200',
  dice: 'bg-green-800 text-green-200',
  puzzle: 'bg-orange-800 text-orange-200',
}

interface GameCardProps {
  game: GameDefinition
  onPlay: (id: GameDefinition['id']) => void
  onRules?: (id: GameDefinition['id']) => void
}

export default function GameCard({ game, onPlay, onRules }: GameCardProps) {
  const playerLabel =
    game.minPlayers === game.maxPlayers
      ? `${game.minPlayers} players`
      : `${game.minPlayers}–${game.maxPlayers} players`

  return (
    <div
      className={`
        relative flex flex-col rounded-2xl border p-5 gap-3
        transition-all duration-200
        ${CATEGORY_COLORS[game.category]}
        ${game.available
          ? 'hover:scale-[1.02] hover:shadow-lg cursor-pointer'
          : 'opacity-60'}
      `}
    >
      {/* Coming Soon ribbon */}
      {!game.available && (
        <div className="absolute top-3 right-3 text-xs font-semibold bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
          Coming soon
        </div>
      )}

      {/* Emoji + name */}
      <div className="flex items-center gap-3">
        <span className="text-4xl" role="img" aria-label={game.name}>
          {game.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-white leading-tight">{game.name}</h2>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_BADGE[game.category]}`}>
            {game.category}
          </span>
        </div>
        {/* Rules info button — only shown when rules are available */}
        {onRules && (
          <button
            onClick={(e) => { e.stopPropagation(); onRules(game.id) }}
            aria-label={`How to play ${game.name}`}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full
              text-slate-400 border border-slate-600 hover:text-white hover:border-slate-400
              transition-colors text-sm font-bold"
          >
            ?
          </button>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-slate-300 flex-1">{game.description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-slate-400">👥 {playerLabel}</span>
        <button
          onClick={() => onPlay(game.id)}
          disabled={!game.available}
          className={`
            px-4 py-1.5 rounded-xl text-sm font-semibold transition-colors
            ${game.available
              ? 'bg-yellow-400 text-slate-900 hover:bg-yellow-300 active:bg-yellow-500'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
          `}
        >
          Play
        </button>
      </div>
    </div>
  )
}
