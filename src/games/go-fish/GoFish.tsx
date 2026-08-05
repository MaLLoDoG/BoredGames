import { useState } from 'react'
import RulesModal from '../../components/RulesModal'
import rules from './rules'
import { useGoFish } from './useGoFish'
import HandoffScreen from './components/HandoffScreen'
import AskPanel from './components/AskPanel'
import BookShelf from './components/BookShelf'
import GameLog from '../farkle/components/GameLog'

interface GoFishProps {
  playerNames: string[]
  onQuitToLobby: () => void
}

const PLAYER_TEXT_COLORS = [
  'text-yellow-400',
  'text-blue-400',
  'text-green-400',
  'text-purple-400',
  'text-red-400',
  'text-indigo-400',
]

const PLAYER_BG_COLORS = [
  'bg-yellow-500/20 border-yellow-500/40',
  'bg-blue-500/20 border-blue-500/40',
  'bg-green-500/20 border-green-500/40',
  'bg-purple-500/20 border-purple-500/40',
  'bg-red-500/20 border-red-500/40',
  'bg-indigo-500/20 border-indigo-500/40',
]

export default function GoFish({ playerNames, onQuitToLobby }: GoFishProps) {
  const { state, ready, ask, continueTurn, endFishTurn, quit } = useGoFish(playerNames)

  const [showRules, setShowRules] = useState(false)
  const { players, current, phase, lastAsk, pile, log } = state
  const activePlayer = players[current]
  const activeColor = PLAYER_TEXT_COLORS[current % PLAYER_TEXT_COLORS.length]

  // ── Handoff screen (§9 hidden information) ──────────────────────────────────
  if (phase === 'handoff') {
    return (
      <HandoffScreen
        playerName={activePlayer.name}
        playerIndex={current}
        onReady={ready}
      />
    )
  }

  // ── Game over ───────────────────────────────────────────────────────────────
  if (phase === 'game-over') {
    const maxBooks = Math.max(...players.map(p => p.books.length))
    const winnerIndices = players.map((p, i) => p.books.length === maxBooks ? i : -1).filter(i => i !== -1)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8 max-w-md mx-auto w-full">
        <div className="text-6xl">🏆</div>
        <h1 className="text-3xl font-extrabold text-yellow-400 text-center">
          {winnerIndices.length === 1
            ? `${players[winnerIndices[0]].name} Wins!`
            : `It's a Tie!`
          }
        </h1>

        {/* Final scores */}
        <div className="w-full bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          {players.map((p, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-5 py-3 border-b border-slate-700 last:border-0
                ${winnerIndices.includes(i) ? PLAYER_BG_COLORS[i % PLAYER_BG_COLORS.length] : ''}
              `}
            >
              <span className={`font-bold ${PLAYER_TEXT_COLORS[i % PLAYER_TEXT_COLORS.length]}`}>
                {winnerIndices.includes(i) ? '🏆 ' : ''}{p.name}
              </span>
              <span className="text-white font-semibold">{p.books.length} 📚</span>
            </div>
          ))}
        </div>

        <GameLog entries={log} />

        <button
          onClick={onQuitToLobby}
          className="w-full py-3 bg-yellow-400 text-slate-900 font-bold rounded-2xl hover:bg-yellow-300 transition-all"
        >
          Back to Lobby
        </button>
      </div>
    )
  }

  // ── Main game screen ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col p-4 gap-4 max-w-lg mx-auto w-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐟</span>
          <span className="text-white font-bold">Go Fish</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRules(true)}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            📖 Rules
          </button>
          <button
            onClick={() => quit(current)}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded"
          >
            🚪 Quit
          </button>
        </div>
      </div>
      {showRules && <RulesModal rules={rules} onClose={() => setShowRules(false)} />}

      {/* Scoreboard — all players' books */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-slate-300 font-bold text-xs uppercase tracking-wider">Books Collected</h2>
          <span className="text-slate-500 text-xs">📦 {pile.length} left in pile</span>
        </div>
        {players.map((p, i) => (
          <BookShelf
            key={i}
            books={p.books}
            playerName={p.name}
            colorClass={PLAYER_TEXT_COLORS[i % PLAYER_TEXT_COLORS.length]}
          />
        ))}
      </div>

      {/* Active player banner */}
      <div className={`rounded-xl border px-4 py-2 flex items-center gap-2 ${PLAYER_BG_COLORS[current % PLAYER_BG_COLORS.length]}`}>
        <span className={`font-extrabold text-lg ${activeColor}`}>{activePlayer.name}</span>
        <span className="text-slate-400 text-sm">— your turn</span>
      </div>

      {/* Phase content */}
      {phase === 'ask' && (
        <AskPanel
          activePlayer={activePlayer}
          activeIndex={current}
          allPlayers={players}
          onAsk={ask}
        />
      )}

      {phase === 'result-got' && lastAsk && (
        <div className="bg-slate-800 rounded-2xl border border-green-500/40 p-5 flex flex-col items-center gap-4 text-center">
          <div className="text-5xl">😄</div>
          <h2 className="text-green-400 font-extrabold text-xl">
            Got {lastAsk.received.length} card{lastAsk.received.length !== 1 ? 's' : ''}!
          </h2>
          <p className="text-slate-300 text-sm">
            {players[lastAsk.targetIndex].name} had {lastAsk.received.length} <strong className="text-white">{lastAsk.rank}</strong>
            {lastAsk.received.length !== 1 ? 's' : ''}.
          </p>
          {lastAsk.newBooks.length > 0 && (
            <p className="text-yellow-400 font-bold text-sm">
              📚 Book{lastAsk.newBooks.length > 1 ? 's' : ''} completed: {lastAsk.newBooks.join(', ')}!
            </p>
          )}
          <p className="text-slate-400 text-sm italic">You get another turn!</p>
          <button
            onClick={continueTurn}
            className="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-400 transition-all"
          >
            Take Another Turn →
          </button>
        </div>
      )}

      {phase === 'result-fish' && lastAsk && (
        <div className={`bg-slate-800 rounded-2xl border p-5 flex flex-col items-center gap-4 text-center
          ${lastAsk.luckyFish ? 'border-yellow-500/40' : 'border-blue-500/40'}`}
        >
          <div className="text-5xl">{lastAsk.luckyFish ? '🎣' : '🐠'}</div>
          <h2 className={`font-extrabold text-xl ${lastAsk.luckyFish ? 'text-yellow-400' : 'text-blue-400'}`}>
            {lastAsk.luckyFish ? 'Lucky Fish!' : 'Go Fish!'}
          </h2>
          {lastAsk.drawnCard ? (
            <p className="text-slate-300 text-sm">
              You drew a <strong className="text-white">{lastAsk.drawnCard.rank}{lastAsk.drawnCard.suit}</strong>.
              {lastAsk.luckyFish && <span className="text-yellow-300"> That's what you asked for — take another turn!</span>}
            </p>
          ) : (
            <p className="text-slate-500 text-sm italic">The pile is empty — no card drawn.</p>
          )}
          <button
            onClick={endFishTurn}
            className={`w-full py-3 font-bold rounded-xl transition-all
              ${lastAsk.luckyFish
                ? 'bg-yellow-400 text-slate-900 hover:bg-yellow-300'
                : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
          >
            {lastAsk.luckyFish ? 'Take Another Turn →' : 'End Turn →'}
          </button>
        </div>
      )}

      {/* Game log */}
      <GameLog entries={log} />
    </div>
  )
}
