import { useEffect, useRef, useState } from 'react'
import RulesModal from '../../components/RulesModal'
import rules from './rules'
import { useShutTheBox } from './useShutTheBox'
import { validCombinations, openTiles, scoreTiles } from './engine'
import type { TileNumber } from './engine'
import TileRack from './components/TileRack'
import DiceDisplay from './components/DiceDisplay'
import ScoreBoard from './components/ScoreBoard'
import GameLog from '../farkle/components/GameLog'
import { playDiceRoll, playFarkle, playWinner } from '../farkle/sounds'

interface ShutTheBoxProps {
  playerNames: string[]
  onQuitToLobby: () => void
}

export default function ShutTheBox({ playerNames, onQuitToLobby }: ShutTheBoxProps) {
  const { state, roll, toggleTile, flip, advance } = useShutTheBox(playerNames)
  const [showRules, setShowRules] = useState(false)

  const currentPlayer = state.players[state.currentPlayerIndex]
  const currentTiles = currentPlayer.tiles
  const canSelect = state.phase === 'choose'
  const openCount = openTiles(currentTiles).length
  const remaining = scoreTiles(currentTiles)

  // Valid combos for current roll
  const combos = canSelect
    ? validCombinations(openTiles(currentTiles), state.diceTotal)
    : []

  const selectedSum = state.selectedTiles.reduce((s, t) => s + t, 0)
  const selectionMatches = selectedSum === state.diceTotal && state.selectedTiles.length > 0

  // ── Sounds ────────────────────────────────────────────────────────────────
  const prevPhase = useRef(state.phase)
  useEffect(() => {
    const prev = prevPhase.current
    prevPhase.current = state.phase
    if (state.phase === 'choose' && prev === 'roll') playDiceRoll()
    if (state.phase === 'bust') { playDiceRoll(); setTimeout(playFarkle, 350) }
    if (state.phase === 'shut') playWinner()
  }, [state.phase])

  const winnerSoundPlayed = useRef(false)
  useEffect(() => {
    if (state.phase === 'game-over' && !winnerSoundPlayed.current) {
      winnerSoundPlayed.current = true
      playWinner()
    }
  }, [state.phase])

  // ── Game Over ─────────────────────────────────────────────────────────────
  if (state.phase === 'game-over' && state.winner !== null) {
    const winners = state.winner.map((id) => state.players[id])
    const isTie = winners.length > 1
    return (
      <div className="min-h-screen flex flex-col p-8 gap-6 max-w-lg mx-auto w-full">
        <button
          onClick={onQuitToLobby}
          className="self-start text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← Lobby
        </button>
        <div className="flex flex-col items-center text-center gap-2">
        <div className="text-8xl">{winners[0].score === 0 ? '🎉' : '🏆'}</div>
        <h1 className="text-5xl font-extrabold text-yellow-400">
          {isTie ? "It's a Tie!" : `${winners[0].name} Wins!`}
        </h1>
        <p className="text-slate-400 text-xl">
          {winners[0].score === 0 ? 'Shut the box! Perfect score!' : `Score: ${winners[0].score}`}
        </p>
        </div>
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 w-full">
          <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wide mb-3">Final Scores</h2>
          {[...state.players]
            .sort((a, b) => (a.score ?? 99) - (b.score ?? 99))
            .map((p) => (
              <div key={p.id} className={`flex justify-between py-1
                ${state.winner?.includes(p.id) ? 'text-yellow-400 font-bold' : 'text-slate-300'}`}>
                <span>{state.winner?.includes(p.id) ? '🥇 ' : ''}{p.name}</span>
                <span>{p.score ?? '—'}</span>
              </div>
            ))}
        </div>
        <button
          onClick={onQuitToLobby}
          className="w-full py-3 bg-yellow-400 text-slate-900 font-bold rounded-2xl hover:bg-yellow-300 transition-all"
        >
          ← Back to Lobby
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-2xl mx-auto w-full gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-yellow-400">📦 Shut the Box</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRules(true)}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            📖 Rules
          </button>
          <button onClick={onQuitToLobby} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            ← Lobby
          </button>
        </div>
      </div>
      {showRules && <RulesModal rules={rules} onClose={() => setShowRules(false)} />}

      {/* Scoreboard */}
      <ScoreBoard players={state.players} currentPlayerIndex={state.currentPlayerIndex} />

      {/* Turn indicator */}
      <div className="text-center">
        <span className="text-slate-400 text-sm">Current turn: </span>
        <span className="text-white font-bold">{currentPlayer.name}</span>
        <span className="ml-3 text-slate-500 text-sm">
          {openCount} tile{openCount !== 1 ? 's' : ''} open — remaining: {remaining}
        </span>
      </div>

      {/* Tile rack */}
      <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 flex flex-col items-center gap-4">
        <TileRack
          tiles={currentTiles}
          selectedTiles={state.selectedTiles}
          onToggle={(t: TileNumber) => toggleTile(t)}
          canSelect={canSelect}
        />

        {/* Dice */}
        {state.dice.length > 0 && (
          <DiceDisplay dice={state.dice} total={state.diceTotal} />
        )}

        {/* Valid combos hint */}
        {canSelect && combos.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-1">
            <span className="text-xs text-slate-500">Valid combos:</span>
            {combos.slice(0, 8).map((combo, i) => (
              <span key={i} className="text-xs bg-slate-700 text-green-300 border border-green-800 px-2 py-0.5 rounded-full">
                {combo.join(' + ')}
              </span>
            ))}
            {combos.length > 8 && (
              <span className="text-xs text-slate-600">+{combos.length - 8} more</span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">

        {/* Roll */}
        {state.phase === 'roll' && (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => roll(false)}
              className="px-8 py-3 bg-yellow-400 text-slate-900 font-bold text-lg rounded-2xl hover:bg-yellow-300 active:scale-95 transition-all shadow-lg shadow-yellow-500/30"
            >
              🎲 Roll Two Dice
            </button>
            {state.canUseSingleDie && (
              <button
                onClick={() => roll(true)}
                className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 active:scale-95 transition-all text-sm"
              >
                🎲 Roll One Die (sum ≤ 6)
              </button>
            )}
          </div>
        )}

        {/* Choose + Flip */}
        {state.phase === 'choose' && (
          <>
            {state.selectedTiles.length === 0 && (
              <p className="text-slate-400 text-sm italic">Click tiles that add up to {state.diceTotal}</p>
            )}
            {state.selectedTiles.length > 0 && !selectionMatches && (
              <p className="text-orange-400 text-sm">
                Selected: {selectedSum} — need {state.diceTotal} ({state.diceTotal - selectedSum > 0 ? '+' : ''}{state.diceTotal - selectedSum} more)
              </p>
            )}
            <button
              onClick={flip}
              disabled={!selectionMatches}
              className={`px-6 py-2.5 font-bold rounded-xl transition-all active:scale-95
                ${selectionMatches
                  ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
            >
              ✔ Flip Tiles {selectionMatches ? `(${state.selectedTiles.join(', ')})` : ''}
            </button>
          </>
        )}

        {/* Bust */}
        {state.phase === 'bust' && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-red-400 font-bold text-xl">
              💀 Bust! No valid move for {state.diceTotal}.
            </p>
            <p className="text-slate-400 text-sm">Score: {currentPlayer.score}</p>
            <button
              onClick={advance}
              className="px-6 py-2 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-all"
            >
              {state.currentPlayerIndex + 1 < state.players.length ? 'Next Player →' : 'See Results →'}
            </button>
          </div>
        )}

        {/* Shut the box */}
        {state.phase === 'shut' && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-yellow-400 font-extrabold text-2xl animate-bounce">🎉 Shut the Box!</p>
            <button
              onClick={advance}
              className="px-6 py-2 bg-yellow-400 text-slate-900 font-bold rounded-xl hover:bg-yellow-300 transition-all"
            >
              {state.currentPlayerIndex + 1 < state.players.length ? 'Next Player →' : 'See Results →'}
            </button>
          </div>
        )}

        {/* Quit */}
        {state.phase !== 'game-over' && (
          <button
            onClick={onQuitToLobby}
            className="px-4 py-2 bg-red-900/60 text-red-300 border border-red-800 font-semibold rounded-xl hover:bg-red-800/60 transition-all text-sm"
          >
            🏳 I Quit
          </button>
        )}
      </div>

      {/* Log — fixed height, never drives page scroll */}
      <GameLog entries={state.log} />
    </div>
  )
}
