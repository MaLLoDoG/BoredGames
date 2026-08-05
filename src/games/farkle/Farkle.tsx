import { useEffect, useRef, useState, useCallback } from 'react'
import RulesModal from '../../components/RulesModal'
import rules from './rules'
import { useFarkle } from './useFarkle'
import { getScoringCombos } from './engine'
import { playDiceRoll, playBank, playFarkle, playNextPlayer, playWinner } from './sounds'
import DiceRoller from './components/DiceRoller'
import ScoreBoard from './components/ScoreBoard'
import GameLog from './components/GameLog'
import ActionBar from './components/ActionBar'
import PlayerTransition from './components/PlayerTransition'

interface FarkleProps {
  playerNames: string[]
  onQuitToLobby: () => void
}

export default function Farkle({ playerNames, onQuitToLobby }: FarkleProps) {
  const {
    state,
    roll,
    toggleHold,
    confirmSetAside,
    bank,
    rollAgain,
    acknowledgeFarkle,
    quit,
  } = useFarkle(playerNames)

  const currentPlayer = state.players[state.currentPlayerIndex]
  const hasHeldDice = state.dice.some((d) => d.held)
  const canSelect = state.phase === 'select' || state.phase === 'decide'
  const combos = canSelect ? getScoringCombos(state.dice) : []
  const availablePoints = combos.reduce((sum, c) => sum + c.points, 0)
  const inFinalRound = state.finalRoundTriggeredBy !== null && state.phase !== 'game-over'

  // ── Player transition overlay ──────────────────────────────────────────────
  const prevPlayerIndex = useRef(state.currentPlayerIndex)
  const prevPhase = useRef(state.phase)
  const [transitionVisible, setTransitionVisible] = useState(false)
  const [transitionPlayer, setTransitionPlayer] = useState(currentPlayer)
  const [showRules, setShowRules] = useState(false)

  useEffect(() => {
    const playerChanged = state.currentPlayerIndex !== prevPlayerIndex.current
    const gameJustStarted = prevPhase.current === 'roll' && prevPlayerIndex.current === 0 && state.log.length === 0

    if (playerChanged && !gameJustStarted && state.phase !== 'game-over') {
      setTransitionPlayer(state.players[state.currentPlayerIndex])
      setTransitionVisible(true)
      playNextPlayer()
    }

    prevPlayerIndex.current = state.currentPlayerIndex
    prevPhase.current = state.phase
  }, [state.currentPlayerIndex, state.phase, state.players, state.log.length])

  // ── Winner sound ───────────────────────────────────────────────────────────
  const winnerSoundPlayed = useRef(false)
  useEffect(() => {
    if (state.phase === 'game-over' && !winnerSoundPlayed.current) {
      winnerSoundPlayed.current = true
      playWinner()
    }
  }, [state.phase])

  // ── Sounds — reactive on state, not on button press ────────────────────────
  // Track previous phase so we only fire when *entering* a phase, never on mount
  // or on unrelated re-renders.
  const prevSoundPhase = useRef<string>('')
  useEffect(() => {
    const prev = prevSoundPhase.current
    const cur = state.phase
    prevSoundPhase.current = cur
    if (cur === prev) return          // no transition — skip
    if (cur === 'select') playDiceRoll()
    if (cur === 'farkle') { playDiceRoll(); setTimeout(playFarkle, 380) }
  }, [state.phase])

  // ── Action handlers (no sounds here — sounds are reactive above) ───────────
  const handleRoll = useCallback(() => { roll() }, [roll])
  const handleRollAgain = useCallback(() => { rollAgain() }, [rollAgain])
  const handleBank = useCallback(() => { playBank(); bank() }, [bank])
  const handleAcknowledgeFarkle = useCallback(() => { acknowledgeFarkle() }, [acknowledgeFarkle])

  function handleQuit() {
    quit()
  }

  // ── Game Over screen ───────────────────────────────────────────────────────
  if (state.phase === 'game-over' && state.winner !== null) {
    const winner = state.players.find((p) => p.id === state.winner)!
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center gap-6">
        <div className="text-8xl">🏆</div>
        <h1 className="text-5xl font-extrabold text-yellow-400">{winner.name} Wins!</h1>
        {state.winByForfeit
          ? <p className="text-slate-400 text-lg">Won by forfeit — all other players quit.</p>
          : <p className="text-slate-400 text-xl">{winner.score.toLocaleString()} points</p>
        }
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 w-full max-w-sm">
          <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wide mb-3">Final Scores</h2>
          {[...state.players]
            .sort((a, b) => b.score - a.score)
            .map((p) => (
              <div key={p.id} className={`flex justify-between py-1 ${
                p.id === winner.id ? 'text-yellow-400 font-bold' : p.quit ? 'text-slate-600 line-through' : 'text-slate-300'
              }`}>
                <span>{p.id === winner.id ? '🥇 ' : p.quit ? '🚪 ' : ''}{p.name}</span>
                <span>{p.score.toLocaleString()}</span>
              </div>
            ))}
        </div>
        <button
          onClick={onQuitToLobby}
          className="px-8 py-3 bg-yellow-400 text-slate-900 font-bold rounded-2xl hover:bg-yellow-300 transition-all"
        >
          ← Back to Lobby
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-3xl mx-auto w-full gap-4">

      {/* Player turn transition overlay */}
      <PlayerTransition
        playerName={transitionPlayer.name}
        playerIndex={transitionPlayer.id}
        visible={transitionVisible}
        onDone={() => setTransitionVisible(false)}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-yellow-400">🎲 Farkle</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRules(true)}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            📖 Rules
          </button>
          <button
            onClick={onQuitToLobby}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Lobby
          </button>
        </div>
      </div>
      {showRules && <RulesModal rules={rules} onClose={() => setShowRules(false)} />}

      {/* Final round banner */}
      {inFinalRound && (
        <div className="bg-yellow-500/20 border border-yellow-500 rounded-xl px-4 py-2 text-center text-yellow-300 text-sm font-semibold">
          🎯 Final Round — {state.players.find(p => p.id === state.finalRoundTriggeredBy)?.name} hit{' '}
          {state.settings.targetScore.toLocaleString()}! Last chance for everyone else.
        </div>
      )}

      {/* Scoreboard §14 */}
      <ScoreBoard
        players={state.players}
        currentPlayerIndex={state.currentPlayerIndex}
        turnTotal={state.turnTotal}
        finalRoundTriggeredBy={state.finalRoundTriggeredBy}
        threeFarkleRule={state.settings.threeFarkleRule}
      />

      {/* Turn indicator */}
      <div className="text-center">
        <span className="text-slate-400 text-sm">Current turn: </span>
        <span className="text-white font-bold">{currentPlayer.name}</span>
        {!currentPlayer.onBoard && (
          <span className="ml-2 text-xs text-slate-500">
            (need 500 to get on the board)
          </span>
        )}
      </div>

      {/* Dice §14 */}
      <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 flex flex-col items-center gap-4">
        <DiceRoller
          dice={state.dice}
          onToggle={toggleHold}
          canSelect={canSelect}
        />

        {/* Available combos hint */}
        {combos.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-1">
            {combos.map((combo, i) => (
              <span key={i} className="text-xs bg-slate-700 text-green-300 border border-green-800 px-2 py-0.5 rounded-full">
                {combo.label} +{combo.points}
              </span>
            ))}
            <span className="text-xs text-slate-500 px-2 py-0.5">
              = {availablePoints} pts available
            </span>
          </div>
        )}
      </div>

      {/* Actions §13 */}
      <ActionBar
        phase={state.phase}
        currentPlayer={currentPlayer}
        turnTotal={state.turnTotal}
        hasHeldDice={hasHeldDice}
        onRoll={handleRoll}
        onBank={handleBank}
        onRollAgain={handleRollAgain}
        onConfirmSetAside={confirmSetAside}
        onAcknowledgeFarkle={handleAcknowledgeFarkle}
        onQuit={handleQuit}
      />

      {/* Game log §14 */}
      <GameLog entries={state.log} />
    </div>
  )
}
