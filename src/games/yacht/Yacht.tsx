import { useYacht } from './useYacht'
import Die from './components/Die'
import ScoreCard from './components/ScoreCard'
import GameLog from '../farkle/components/GameLog'
import RulesModal from '../../components/RulesModal'
import rules from './rules'
import { totalScore, winners } from './engine'
import { useState } from 'react'

interface YachtProps {
  playerNames: string[]
  onQuitToLobby: () => void
}

const PLAYER_COLORS = [
  'text-yellow-400', 'text-blue-400', 'text-green-400',
  'text-purple-400', 'text-red-400',  'text-indigo-400',
]

const PLAYER_BG = [
  'bg-yellow-500/20 border-yellow-500/40', 'bg-blue-500/20 border-blue-500/40',
  'bg-green-500/20 border-green-500/40',   'bg-purple-500/20 border-purple-500/40',
  'bg-red-500/20 border-red-500/40',       'bg-indigo-500/20 border-indigo-500/40',
]

export default function Yacht({ playerNames, onQuitToLobby }: YachtProps) {
  const { state, roll, toggleHold, scoreNow, score } = useYacht(playerNames)
  const [showRules, setShowRules] = useState(false)

  const { players, current, round, rollsLeft, dice, phase, log } = state
  const activePlayer = players[current]
  const hasRolled   = rollsLeft < 3
  const canRoll     = phase === 'rolling' && rollsLeft > 0
  // Dice are holdable only between rolls 1–2 (not after roll 3 or in scoring)
  const canHold     = phase === 'rolling' && hasRolled && rollsLeft > 0

  // ── Game over ───────────────────────────────────────────────────────────────
  if (phase === 'game-over') {
    const winnerIndices = winners(players)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6 max-w-lg mx-auto w-full">
        <div className="text-7xl">🏆</div>
        <h1 className="text-4xl font-extrabold text-yellow-400 text-center">
          {winnerIndices.length === 1
            ? `${players[winnerIndices[0]].name} Wins!`
            : "It's a Tie!"}
        </h1>

        <div className="w-full bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          {[...players]
            .sort((a, b) => totalScore(b) - totalScore(a))
            .map((p, rank) => (
              <div
                key={p.id}
                className={`flex items-center justify-between px-5 py-3 border-b border-slate-700 last:border-0
                  ${winnerIndices.includes(p.id) ? PLAYER_BG[p.id % PLAYER_BG.length] : ''}
                `}
              >
                <span className={`font-bold ${PLAYER_COLORS[p.id % PLAYER_COLORS.length]}`}>
                  {rank === 0 ? '🥇 ' : rank === 1 ? '🥈 ' : '🥉 '}{p.name}
                </span>
                <span className="text-white font-semibold">{totalScore(p)}</span>
              </div>
            ))}
        </div>

        <ScoreCard players={players} activeDice={dice} phase="game-over" />
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

  // ── Main game screen — fixed to viewport, no page scroll ───────────────────
  return (
    <div className="h-screen overflow-hidden flex flex-col p-3 gap-2 max-w-3xl mx-auto">
      {showRules && <RulesModal rules={rules} onClose={() => setShowRules(false)} />}

      {/* Header — 1 line */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-extrabold text-yellow-400">⚀ Yacht</h1>
          <div className={`rounded-lg border px-3 py-1 flex items-center gap-2 ${PLAYER_BG[current % PLAYER_BG.length]}`}>
            <span className={`font-bold text-sm ${PLAYER_COLORS[current % PLAYER_COLORS.length]}`}>{activePlayer.name}</span>
            <span className="text-slate-500 text-xs">· Round {round}/12</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowRules(true)} className="text-sm text-slate-400 hover:text-white transition-colors">📖 Rules</button>
          <button onClick={onQuitToLobby} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">← Lobby</button>
        </div>
      </div>

      {/* Body — fills remaining height, never overflows */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* LEFT — dice + log. w-96 = 384px, plenty for 5 × w-16 dice + gaps */}
        <div className="flex flex-col gap-3 w-96 shrink-0">

          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 flex flex-col gap-4 shrink-0">
            {/* Roll pips + hint */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {[3, 2, 1].map(r => (
                  <span key={r} className={`w-2.5 h-2.5 rounded-full transition-colors ${rollsLeft < r ? 'bg-yellow-400' : 'bg-slate-600'}`} />
                ))}
              </div>
              <span className="text-slate-400 text-xs">
                {phase === 'scoring' || rollsLeft === 0 ? 'Pick a category →'
                  : rollsLeft === 3 ? 'Roll to start'
                  : `${rollsLeft} roll${rollsLeft !== 1 ? 's' : ''} left — tap to hold`}
              </span>
            </div>

            {/* Full-size dice row, evenly spaced */}
            <div className="flex justify-around py-2">
              {dice.map(die => (
                <Die key={die.id} die={die} canHold={canHold} onToggle={() => toggleHold(die.id)} />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button onClick={roll} disabled={!canRoll}
                className="flex-1 py-2.5 rounded-xl bg-yellow-400 text-slate-900 font-extrabold text-sm
                  hover:bg-yellow-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                {!hasRolled ? '🎲 Roll!' : rollsLeft > 0 ? '🎲 Roll Again' : '🎲 No Rolls Left'}
              </button>
              {hasRolled && phase === 'rolling' && rollsLeft > 0 && (
                <button onClick={scoreNow}
                  className="px-3 py-2.5 rounded-xl bg-slate-700 text-slate-300 font-semibold text-xs
                    hover:bg-slate-600 transition-all whitespace-nowrap">
                  Score Now
                </button>
              )}
            </div>
          </div>

          {/* Log — fills remaining left height, scrolls internally only */}
          <div className="flex-1 min-h-0 overflow-hidden rounded-xl">
            <GameLog entries={log} />
          </div>
        </div>

        {/* RIGHT — scorecard: max-w-sm keeps it from ballooning; scrolls internally */}
        <div className="max-w-sm w-full overflow-y-auto min-h-0">
          <ScoreCard players={players} activeDice={dice} phase={phase} onScore={score} />
        </div>

      </div>
    </div>
  )
}
