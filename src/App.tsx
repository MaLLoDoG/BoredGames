import { useState } from 'react'
import Lobby from './components/Lobby'
import Farkle from './games/farkle/Farkle'
import ShutTheBox from './games/shut-the-box/ShutTheBox'
import type { GameId } from './types/games'

type AppView =
  | { screen: 'lobby' }
  | { screen: 'setup'; gameId: GameId }
  | { screen: 'farkle'; playerNames: string[] }
  | { screen: 'shut-the-box'; playerNames: string[] }

const PLAYER_COUNT_RANGE: Partial<Record<GameId, [number, number]>> = {
  'farkle': [2, 6],
  'shut-the-box': [1, 4],
}

export default function App() {
  const [view, setView] = useState<AppView>({ screen: 'lobby' })

  function handlePlay(gameId: GameId) {
    if (PLAYER_COUNT_RANGE[gameId]) {
      setView({ screen: 'setup', gameId })
    } else {
      setView({ screen: 'setup', gameId })
    }
  }

  if (view.screen === 'setup') {
    return (
      <PlayerSetup
        gameId={view.gameId}
        onStart={(names) => {
          if (view.gameId === 'farkle') setView({ screen: 'farkle', playerNames: names })
          else if (view.gameId === 'shut-the-box') setView({ screen: 'shut-the-box', playerNames: names })
          else setView({ screen: 'lobby' })
        }}
        onBack={() => setView({ screen: 'lobby' })}
      />
    )
  }

  if (view.screen === 'farkle') {
    return (
      <Farkle
        playerNames={view.playerNames}
        onQuitToLobby={() => setView({ screen: 'lobby' })}
      />
    )
  }

  if (view.screen === 'shut-the-box') {
    return (
      <ShutTheBox
        playerNames={view.playerNames}
        onQuitToLobby={() => setView({ screen: 'lobby' })}
      />
    )
  }

  return <Lobby onPlay={handlePlay} />
}

// ─── Player Setup Screen ──────────────────────────────────────────────────────

interface PlayerSetupProps {
  gameId: GameId
  onStart: (names: string[]) => void
  onBack: () => void
}

function PlayerSetup({ gameId, onStart, onBack }: PlayerSetupProps) {
  const [min, max] = PLAYER_COUNT_RANGE[gameId] ?? [2, 4]
  const [count, setCount] = useState(2)
  const [names, setNames] = useState<string[]>(['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6'])

  const visibleNames = names.slice(0, count)
  const allFilled = visibleNames.every((n) => n.trim().length > 0)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-6 max-w-md mx-auto w-full">
      <h1 className="text-3xl font-extrabold text-yellow-400">🎲 Set Up {gameId.charAt(0).toUpperCase() + gameId.slice(1)}</h1>

      {/* Player count */}
      <div className="w-full bg-slate-800 rounded-2xl p-5 border border-slate-700 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-slate-300 font-semibold">Number of Players</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCount((c) => Math.max(min, c - 1))}
              disabled={count <= min}
              className="w-8 h-8 rounded-lg bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-30 font-bold"
            >−</button>
            <span className="text-white font-bold text-lg w-4 text-center">{count}</span>
            <button
              onClick={() => setCount((c) => Math.min(max, c + 1))}
              disabled={count >= max}
              className="w-8 h-8 rounded-lg bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-30 font-bold"
            >+</button>
          </div>
        </div>

        {/* Player names */}
        {visibleNames.map((name, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-slate-500 text-sm w-16">Player {i + 1}</span>
            <input
              type="text"
              value={name}
              maxLength={20}
              onChange={(e) => {
                const next = [...names]
                next[i] = e.target.value
                setNames(next)
              }}
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-yellow-400"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-3 w-full">
        <button
          onClick={onBack}
          className="flex-1 py-2.5 bg-slate-700 text-slate-300 font-semibold rounded-xl hover:bg-slate-600 transition-all"
        >
          ← Back
        </button>
        <button
          onClick={() => onStart(visibleNames.map((n) => n.trim() || `Player ${visibleNames.indexOf(n) + 1}`))}
          disabled={!allFilled}
          className="flex-1 py-2.5 bg-yellow-400 text-slate-900 font-bold rounded-xl hover:bg-yellow-300 disabled:opacity-40 transition-all"
        >
          Start Game →
        </button>
      </div>
    </div>
  )
}
