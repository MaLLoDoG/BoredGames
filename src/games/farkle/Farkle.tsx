import { useFarkle } from './useFarkle'
import { getScoringCombos } from './engine'
import DiceRoller from './components/DiceRoller'
import ScoreBoard from './components/ScoreBoard'
import GameLog from './components/GameLog'
import ActionBar from './components/ActionBar'

interface FarkleProps {
  playerNames: string[]
  onQuitToLobby: () => void
}

export default function Farkle({ playerNames, onQuitToLobby }: FarkleProps) {
  const {
    state,
    roll,
    toggleHold,
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

  // §14 — show final round banner
  const inFinalRound = state.finalRoundTriggeredBy !== null && state.phase !== 'game-over'

  function handleQuit() {
    quit()
    // If only 2 players, quitting ends the game — handled by engine
  }

  // Game Over screen
  if (state.phase === 'game-over' && state.winner !== null) {
    const winner = state.players.find((p) => p.id === state.winner)!
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center gap-6">
        <div className="text-8xl">🏆</div>
        <h1 className="text-5xl font-extrabold text-yellow-400">{winner.name} Wins!</h1>
        <p className="text-slate-400 text-xl">{winner.score.toLocaleString()} points</p>
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 w-full max-w-sm">
          <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wide mb-3">Final Scores</h2>
          {[...state.players]
            .sort((a, b) => b.score - a.score)
            .map((p) => (
              <div key={p.id} className={`flex justify-between py-1 ${p.id === winner.id ? 'text-yellow-400 font-bold' : 'text-slate-300'}`}>
                <span>{p.id === winner.id ? '🥇 ' : ''}{p.name}</span>
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-yellow-400">🎲 Farkle</h1>
        <button
          onClick={onQuitToLobby}
          className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← Lobby
        </button>
      </div>

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
        onRoll={roll}
        onBank={bank}
        onRollAgain={rollAgain}
        onConfirmSetAside={() => {}} // toggleHold + decide phase handles this
        onAcknowledgeFarkle={acknowledgeFarkle}
        onQuit={handleQuit}
      />

      {/* Game log §14 */}
      <GameLog entries={state.log} />
    </div>
  )
}
