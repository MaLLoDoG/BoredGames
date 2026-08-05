import { useState } from 'react'
import GameCard from './GameCard'
import { GAMES, CATEGORY_LABELS } from '../types/games'
import type { GameDefinition } from '../types/games'

type CategoryFilter = GameDefinition['category'] | 'all'

interface LobbyProps {
  onPlay: (id: GameDefinition['id']) => void
}

export default function Lobby({ onPlay }: LobbyProps) {
  const [filter, setFilter] = useState<CategoryFilter>('all')

  const categories: CategoryFilter[] = ['all', 'board', 'card', 'dice', 'puzzle']

  const visibleGames =
    filter === 'all' ? GAMES : GAMES.filter((g) => g.category === filter)

  const filterLabel = (cat: CategoryFilter) =>
    cat === 'all' ? 'All Games' : CATEGORY_LABELS[cat]

  return (
    <div className="min-h-screen flex flex-col px-4 py-8 max-w-5xl mx-auto w-full">

      {/* Header */}
      <header className="text-center mb-10">
        <div className="text-7xl mb-3" role="img" aria-label="dice">🎲</div>
        <h1 className="text-5xl font-extrabold text-yellow-400 tracking-tight mb-2">
          BoredGames
        </h1>
        <p className="text-slate-400 text-lg">
          No AI. No opponents. Just you, the rules, and whoever is sitting across from you.
        </p>
      </header>

      {/* Category filter pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`
              px-4 py-1.5 rounded-full text-sm font-semibold transition-colors border
              ${filter === cat
                ? 'bg-yellow-400 text-slate-900 border-yellow-400'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500 hover:text-white'}
            `}
          >
            {filterLabel(cat)}
          </button>
        ))}
      </div>

      {/* Game grid */}
      <main>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleGames.map((game) => (
            <GameCard key={game.id} game={game} onPlay={onPlay} />
          ))}
        </div>

        {visibleGames.length === 0 && (
          <p className="text-center text-slate-500 mt-16 text-lg">
            No games in this category yet.
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto pt-12 text-center text-slate-600 text-sm">
        All games are public domain rules. No AI opponents. Pass &amp; play only.
      </footer>
    </div>
  )
}
