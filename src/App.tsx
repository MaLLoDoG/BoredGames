import { useState } from 'react'
import Lobby from './components/Lobby'
import type { GameId } from './types/games'

type AppView = { screen: 'lobby' } | { screen: 'game'; gameId: GameId }

export default function App() {
  const [view, setView] = useState<AppView>({ screen: 'lobby' })

  function handlePlay(gameId: GameId) {
    // Games will be wired in here as they are built
    console.log(`Launching: ${gameId}`)
    setView({ screen: 'game', gameId })
  }

  function handleQuit() {
    setView({ screen: 'lobby' })
  }

  if (view.screen === 'game') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <p className="text-slate-400 text-xl mb-2">🚧 Coming soon</p>
        <p className="text-slate-500 mb-6">
          <strong className="text-white">{view.gameId}</strong> isn't built yet.
        </p>
        <button
          onClick={handleQuit}
          className="px-6 py-2 bg-yellow-400 text-slate-900 font-semibold rounded-xl hover:bg-yellow-300 transition-colors"
        >
          ← Back to Lobby
        </button>
      </div>
    )
  }

  return <Lobby onPlay={handlePlay} />
}
