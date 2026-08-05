import type { TurnPhase, PlayerState } from '../engine'

interface ActionBarProps {
  phase: TurnPhase
  currentPlayer: PlayerState
  turnTotal: number
  hasHeldDice: boolean
  onRoll: () => void
  onBank: () => void
  onRollAgain: () => void
  onConfirmSetAside: () => void
  onAcknowledgeFarkle: () => void
  onQuit: () => void
}

export default function ActionBar({
  phase,
  currentPlayer,
  turnTotal,
  hasHeldDice,
  onRoll,
  onBank,
  onRollAgain,
  onConfirmSetAside,
  onAcknowledgeFarkle,
  onQuit,
}: ActionBarProps) {
  const canBank = currentPlayer.onBoard || turnTotal >= 500

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {/* §13 — Roll (start of turn or hot-dice) */}
      {(phase === 'roll' || phase === 'hot-dice') && (
        <button
          onClick={onRoll}
          className="px-8 py-3 bg-yellow-400 text-slate-900 font-bold text-lg rounded-2xl hover:bg-yellow-300 active:scale-95 transition-all shadow-lg shadow-yellow-500/30"
        >
          {phase === 'hot-dice' ? '🔥 Hot Dice — Roll All 6!' : '🎲 Roll'}
        </button>
      )}

      {/* §13 — Select phase: dice selected but not confirmed */}
      {phase === 'select' && (
        <p className="text-slate-400 text-sm italic">
          Click dice to select scoring dice, then confirm
        </p>
      )}

      {/* §13 — Decide phase: at least one die held */}
      {phase === 'decide' && (
        <>
          {hasHeldDice && (
            <button
              onClick={onConfirmSetAside}
              className="px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-400 active:scale-95 transition-all"
            >
              ✔ Confirm Selection
            </button>
          )}
          <button
            onClick={onRollAgain}
            disabled={hasHeldDice}
            className={`px-5 py-2.5 font-semibold rounded-xl transition-all active:scale-95
              ${hasHeldDice
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-500'}`}
          >
            🎲 Roll Again
          </button>
          <button
            onClick={onBank}
            disabled={!canBank || hasHeldDice}
            title={!canBank ? 'Need 500 pts to get on the board' : ''}
            className={`px-5 py-2.5 font-semibold rounded-xl transition-all active:scale-95
              ${!canBank || hasHeldDice
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-500 text-white hover:bg-emerald-400'}`}
          >
            🏦 Bank {turnTotal > 0 ? `(${turnTotal.toLocaleString()})` : ''}
          </button>
        </>
      )}

      {/* §8 — Farkle acknowledgement */}
      {phase === 'farkle' && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-red-400 font-bold text-xl animate-pulse">💀 FARKLE! Turn over.</p>
          <button
            onClick={onAcknowledgeFarkle}
            className="px-6 py-2 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-all"
          >
            Next Player →
          </button>
        </div>
      )}

      {/* Quit button — always visible except game-over */}
      {phase !== 'game-over' && (
        <button
          onClick={onQuit}
          className="px-4 py-2 bg-red-900/60 text-red-300 border border-red-800 font-semibold rounded-xl hover:bg-red-800/60 transition-all text-sm"
        >
          🏳 I Quit
        </button>
      )}
    </div>
  )
}
