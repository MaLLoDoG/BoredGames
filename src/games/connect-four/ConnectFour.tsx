import { useState } from 'react'
import RulesModal from '../../components/RulesModal'
import rules from './rules'
import { useConnectFour } from './useConnectFour'
import { legalMoves, COLS, ROWS } from './engine'
import GameLog from '../farkle/components/GameLog'
import { playWinner } from '../farkle/sounds'
import { useEffect, useRef } from 'react'

const PLAYER_COLORS = {
  1: { disc: 'bg-red-500 shadow-red-500/60',   ring: 'border-red-400',   text: 'text-red-400',   label: '🔴 Red'    },
  2: { disc: 'bg-yellow-400 shadow-yellow-400/60', ring: 'border-yellow-300', text: 'text-yellow-300', label: '🟡 Yellow' },
} as const

interface ConnectFourProps {
  playerNames: string[]
  onQuitToLobby: () => void
}

export default function ConnectFour({ playerNames, onQuitToLobby }: ConnectFourProps) {
  const { state, drop, quit } = useConnectFour(playerNames[0], playerNames[1])
  const [hoverCol, setHoverCol] = useState<number | null>(null)
  const [showRules, setShowRules] = useState(false)

  const legal = legalMoves(state.board)
  const canPlay = state.phase === 'playing'

  // ── Winner sound ───────────────────────────────────────────────────────────
  const winSoundPlayed = useRef(false)
  useEffect(() => {
    if (state.phase === 'won' && !winSoundPlayed.current) {
      winSoundPlayed.current = true
      playWinner()
    }
  }, [state.phase])

  // ── Game Over ──────────────────────────────────────────────────────────────
  if (state.phase !== 'playing') {
    const isDraw = state.phase === 'draw'
    const winnerName = state.winner ? state.players[state.winner - 1] : null
    const winnerColor = state.winner ? PLAYER_COLORS[state.winner] : null

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center gap-6">
        <div className="text-8xl">{isDraw ? '🤝' : '🏆'}</div>
        <h1 className={`text-5xl font-extrabold ${winnerColor?.text ?? 'text-slate-300'}`}>
          {isDraw ? "It's a Draw!" : `${winnerName} Wins!`}
        </h1>
        {!isDraw && winnerColor && (
          <p className="text-slate-400 text-lg">{winnerColor.label} connected four!</p>
        )}
        {/* Show final board */}
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
          <BoardGrid
            board={state.board}
            winningCells={state.winningCells}
            lastMove={state.lastMove}
            hoverCol={null}
            onDrop={() => {}}
            onHover={() => {}}
            onLeave={() => {}}
            canPlay={false}
            legal={[]}
          />
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

  const cp = PLAYER_COLORS[state.currentPlayer]
  const currentName = state.players[state.currentPlayer - 1]

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-2xl mx-auto w-full gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-yellow-400">🟡 Connect Four</h1>
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

      {/* Player indicators */}
      <div className="grid grid-cols-2 gap-3">
        {([1, 2] as const).map((p) => {
          const col = PLAYER_COLORS[p]
          const name = state.players[p - 1]
          const isActive = state.currentPlayer === p
          return (
            <div key={p} className={`rounded-xl p-3 border text-center transition-all
              ${isActive ? `bg-slate-800 ${col.ring} border-2` : 'bg-slate-800/50 border-slate-700'}`}>
              <div className={`font-bold ${isActive ? col.text : 'text-slate-500'}`}>
                {isActive ? '▶ ' : ''}{name}
              </div>
              <div className={`text-sm ${isActive ? 'text-slate-300' : 'text-slate-600'}`}>
                {col.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Turn indicator */}
      <div className={`text-center font-semibold ${cp.text}`}>
        {currentName}'s turn — drop a disc
      </div>

      {/* Board */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex justify-center">
        <BoardGrid
          board={state.board}
          winningCells={state.winningCells}
          lastMove={state.lastMove}
          hoverCol={hoverCol}
          onDrop={(col) => { if (canPlay && legal.includes(col)) drop(col) }}
          onHover={(col) => canPlay && setHoverCol(col)}
          onLeave={() => setHoverCol(null)}
          canPlay={canPlay}
          legal={legal}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-center">
        <button
          onClick={() => quit()}
          className="px-4 py-2 bg-red-900/60 text-red-300 border border-red-800 font-semibold rounded-xl hover:bg-red-800/60 transition-all text-sm"
        >
          🏳 I Quit
        </button>
      </div>

      <GameLog entries={state.log} />
    </div>
  )
}

// ─── Board Grid ───────────────────────────────────────────────────────────────

interface BoardGridProps {
  board: ReturnType<typeof import('./engine').createGame>['board']
  winningCells: [number, number][]
  lastMove: [number, number] | null
  hoverCol: number | null
  onDrop: (col: number) => void
  onHover: (col: number) => void
  onLeave: () => void
  canPlay: boolean
  legal: number[]
}

function BoardGrid({ board, winningCells, lastMove, hoverCol, onDrop, onHover, onLeave, canPlay, legal }: BoardGridProps) {
  const winSet = new Set(winningCells.map(([r, c]) => `${r},${c}`))

  return (
    <div className="flex flex-col gap-1" onMouseLeave={onLeave}>
      {/* Drop arrow indicators */}
      <div className="flex gap-1 mb-1">
        {Array.from({ length: COLS }, (_, col) => {
          const isHover = hoverCol === col
          const isLegal = legal.includes(col)
          return (
            <div
              key={col}
              className={`w-10 h-5 flex items-center justify-center text-xs transition-all
                ${isHover && isLegal ? 'text-yellow-400 opacity-100' : 'opacity-0'}`}
            >
              ▼
            </div>
          )
        })}
      </div>

      {/* Rows — render top-down visually (row ROWS-1 first) */}
      {Array.from({ length: ROWS }, (_, visualRow) => {
        const row = ROWS - 1 - visualRow  // flip: visual top = internal top
        return (
          <div key={row} className="flex gap-1">
            {Array.from({ length: COLS }, (_, col) => {
              const cell = board[row][col]
              const isWin = winSet.has(`${row},${col}`)
              const isLast = lastMove?.[0] === row && lastMove?.[1] === col
              const isHoverCol = hoverCol === col && legal.includes(col) && canPlay

              let discStyle = 'bg-slate-700'
              if (cell === 1) discStyle = `bg-red-500 ${isWin ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-800' : ''} ${isLast && !isWin ? 'ring-2 ring-red-200 ring-offset-1 ring-offset-slate-800' : ''}`
              if (cell === 2) discStyle = `bg-yellow-400 ${isWin ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-800' : ''} ${isLast && !isWin ? 'ring-2 ring-yellow-100 ring-offset-1 ring-offset-slate-800' : ''}`

              return (
                <button
                  key={col}
                  onClick={() => onDrop(col)}
                  onMouseEnter={() => onHover(col)}
                  disabled={!canPlay || !legal.includes(col)}
                  aria-label={`Column ${col + 1}`}
                  className={`
                    w-10 h-10 rounded-full transition-all duration-100
                    ${discStyle}
                    ${cell === 0 && isHoverCol ? 'bg-slate-500' : ''}
                    ${canPlay && legal.includes(col) ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                  `}
                />
              )
            })}
          </div>
        )
      })}

      {/* Column labels A-G */}
      <div className="flex gap-1 mt-1">
        {Array.from({ length: COLS }, (_, col) => (
          <div key={col} className="w-10 text-center text-xs text-slate-600">
            {String.fromCharCode(65 + col)}
          </div>
        ))}
      </div>
    </div>
  )
}
