import { useState } from 'react'
import type { Player, Rank } from '../engine'
import { askableRanks } from '../engine'
import HandDisplay from './HandDisplay'

interface AskPanelProps {
  activePlayer: Player
  activeIndex: number
  allPlayers: Player[]
  onAsk: (targetIndex: number, rank: Rank) => void
}

const PLAYER_COLORS = [
  'border-yellow-500 bg-yellow-500/10 text-yellow-300',
  'border-blue-500 bg-blue-500/10 text-blue-300',
  'border-green-500 bg-green-500/10 text-green-300',
  'border-purple-500 bg-purple-500/10 text-purple-300',
  'border-red-500 bg-red-500/10 text-red-300',
  'border-indigo-500 bg-indigo-500/10 text-indigo-300',
]

export default function AskPanel({ activePlayer, activeIndex, allPlayers, onAsk }: AskPanelProps) {
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null)
  const [selectedRank, setSelectedRank] = useState<Rank | null>(null)

  const askable = askableRanks(activePlayer.hand)
  const canAsk = selectedTarget !== null && selectedRank !== null

  function handleAsk() {
    if (selectedTarget === null || selectedRank === null) return
    onAsk(selectedTarget, selectedRank)
    setSelectedTarget(null)
    setSelectedRank(null)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Your hand */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
        <h3 className="text-slate-300 font-bold text-sm uppercase tracking-wide mb-3">
          🎴 Your Hand ({activePlayer.hand.length} card{activePlayer.hand.length !== 1 ? 's' : ''})
        </h3>
        <HandDisplay
          hand={activePlayer.hand}
          selectable
          selectedRank={selectedRank}
          onSelectRank={(r) => setSelectedRank(prev => prev === r ? null : r)}
        />
        {askable.length === 0 && (
          <p className="text-slate-500 text-xs italic text-center mt-2">
            Your hand is empty — draw a card!
          </p>
        )}
      </div>

      {/* Pick a player to ask */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
        <h3 className="text-slate-300 font-bold text-sm uppercase tracking-wide mb-3">
          👥 Who do you want to ask?
        </h3>
        <div className="flex flex-wrap gap-2">
          {allPlayers.map((p, i) => {
            if (i === activeIndex) return null
            const colors = PLAYER_COLORS[i % PLAYER_COLORS.length]
            const isSelected = selectedTarget === i
            return (
              <button
                key={i}
                onClick={() => setSelectedTarget(prev => prev === i ? null : i)}
                className={`
                  px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all duration-150
                  ${isSelected ? colors + ' scale-105 shadow-lg' : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'}
                `}
              >
                {p.name}
                <span className="ml-2 text-xs opacity-70">{p.books.length} 📚</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Ask button */}
      <button
        onClick={handleAsk}
        disabled={!canAsk}
        className="w-full py-3.5 rounded-2xl bg-yellow-400 text-slate-900 font-extrabold text-lg
          hover:bg-yellow-300 disabled:opacity-30 disabled:cursor-not-allowed
          transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]"
      >
        {canAsk
          ? `Ask ${allPlayers[selectedTarget!].name} for ${selectedRank!}s →`
          : 'Select a rank from your hand and a player to ask'
        }
      </button>
    </div>
  )
}
