import { useState } from 'react';
import { useCheckers } from './useCheckers';
import RulesModal from '../../components/RulesModal';
import { checkersRules } from './rules';
import type { Cell, Player } from './engine';

interface CheckersProps {
  players: string[];
  onQuit: () => void;
}

function cellLabel(cell: Cell): string {
  if (cell === 'r') return '⬤';
  if (cell === 'R') return '♛';
  if (cell === 'b') return '⬤';
  if (cell === 'B') return '♛';
  return '';
}

function cellColor(cell: Cell): string {
  if (cell === 'r' || cell === 'R') return 'text-red-500';
  if (cell === 'b' || cell === 'B') return 'text-gray-900';
  return '';
}

export function Checkers({ players, onQuit }: CheckersProps) {
  const { state, select, deselect, move, chain, resign, offerDraw, acceptDraw, declineDraw, reset } = useCheckers();
  const [showRules, setShowRules] = useState(false);
  const [showLog, setShowLog] = useState(false);

  const { board, current, phase, selected, legalMoves, winner, drawOfferedBy, log } = state;

  // Map player index to name
  const redName = players[0] ?? 'Red';
  const blackName = players[1] ?? 'Black';
  function playerName(p: Player) {
    return p === 'red' ? redName : blackName;
  }

  function handleSquareClick(idx: number) {
    if (phase === 'game-over') return;
    const cell = board[idx];
    const isOwn = current === 'red'
      ? (cell === 'r' || cell === 'R')
      : (cell === 'b' || cell === 'B');

    if (phase === 'select') {
      if (isOwn) select(idx);
      return;
    }
    if (phase === 'move') {
      if (idx === selected) {
        // clicking the selected piece again deselects it
        deselect();
      } else if (legalMoves.includes(idx)) {
        move(idx);
      } else if (isOwn) {
        // re-select a different piece
        select(idx);
      }
      return;
    }
    if (phase === 'chain') {
      if (legalMoves.includes(idx)) chain(idx);
      return;
    }
  }

  function squareBg(row: number, col: number, idx: number): string {
    const isDark = (row + col) % 2 === 1;
    if (!isDark) return 'bg-amber-100';
    if (idx === selected) return 'bg-yellow-400';
    if (legalMoves.includes(idx)) return 'bg-green-400';
    return 'bg-amber-800';
  }

  const currentName = playerName(current);
  const isDrawOfferedToMe = drawOfferedBy !== null && drawOfferedBy !== current;

  return (
    <div className="min-h-screen flex flex-col bg-amber-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-amber-900 text-amber-50">
        <button onClick={onQuit} className="text-sm underline">← Lobby</button>
        <h1 className="font-bold text-lg">Checkers</h1>
        <button onClick={() => setShowRules(true)} className="text-sm underline">📖 Rules</button>
      </div>

      {/* Status bar */}
      <div className="px-4 py-2 bg-amber-800 text-amber-50 text-center text-sm font-medium">
        {phase === 'game-over' ? (
          winner === 'draw'
            ? `Draw${state.drawReason ? ` (${state.drawReason})` : ''}!`
            : `🏆 ${playerName(winner!)} wins!`
        ) : phase === 'chain' ? (
          `${currentName} — keep jumping!`
        ) : (
          `${currentName}'s turn`
        )}
      </div>

      {/* Draw offer banner */}
      {isDrawOfferedToMe && (
        <div className="flex items-center justify-center gap-3 px-4 py-2 bg-blue-100 text-blue-800 text-sm">
          <span>{playerName(drawOfferedBy!)} offers a draw.</span>
          <button onClick={acceptDraw} className="px-3 py-1 bg-blue-600 text-white rounded text-xs">Accept</button>
          <button onClick={declineDraw} className="px-3 py-1 bg-gray-400 text-white rounded text-xs">Decline</button>
        </div>
      )}

      {/* Board */}
      <div className="flex justify-center p-4">
        <div className="grid grid-cols-8 border-2 border-amber-900"
             style={{ width: 'min(90vw, 480px)', height: 'min(90vw, 480px)' }}>
          {Array.from({ length: 64 }, (_, idx) => {
            const row = Math.floor(idx / 8);
            const col = idx % 8;
            const cell = board[idx];
            const isDark = (row + col) % 2 === 1;
            const isLegal = legalMoves.includes(idx);
            return (
              <div
                key={idx}
                onClick={() => handleSquareClick(idx)}
                className={`
                  flex items-center justify-center cursor-pointer relative
                  ${squareBg(row, col, idx)}
                  ${isDark && phase !== 'game-over' ? 'hover:opacity-80' : ''}
                `}
                style={{ aspectRatio: '1' }}
              >
                {cell && (
                  <span className={`text-2xl leading-none select-none ${cellColor(cell)}`}>
                    {cellLabel(cell)}
                  </span>
                )}
                {isLegal && !cell && (
                  <span className="w-3 h-3 rounded-full bg-green-600 opacity-70" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Player legend */}
      <div className="flex justify-center gap-8 px-4 pb-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-red-500 text-xl">⬤</span>
          <span className={current === 'red' && phase !== 'game-over' ? 'font-bold' : ''}>{redName} (Red)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-900 text-xl">⬤</span>
          <span className={current === 'black' && phase !== 'game-over' ? 'font-bold' : ''}>{blackName} (Black)</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-2 px-4 py-3">
        {phase !== 'game-over' && (
          <>
            {!isDrawOfferedToMe && drawOfferedBy === null && (
              <button
                onClick={offerDraw}
                className="px-3 py-1 rounded bg-blue-500 text-white text-sm"
              >
                Offer Draw
              </button>
            )}
            <button
              onClick={() => { if (window.confirm(`${currentName} resigns?`)) resign(); }}
              className="px-3 py-1 rounded bg-gray-500 text-white text-sm"
            >
              😤 Flip Board
            </button>
          </>
        )}
        {phase === 'game-over' && (
          <button onClick={reset} className="px-4 py-2 rounded bg-amber-700 text-white font-medium">
            Play Again
          </button>
        )}
        <button onClick={onQuit} className="px-3 py-1 rounded bg-gray-300 text-gray-700 text-sm">
          I Quit
        </button>
      </div>

      {/* Game log toggle */}
      <div className="px-4 pb-4">
        <button
          onClick={() => setShowLog(v => !v)}
          className="text-xs text-amber-700 underline"
        >
          {showLog ? 'Hide log' : 'Show log'}
        </button>
        {showLog && (
          <div className="h-36 overflow-y-auto mt-1 p-2 bg-white border border-amber-200 rounded text-xs text-gray-600 space-y-0.5">
            {[...log].reverse().map((entry, i) => (
              <div key={i}>{entry}</div>
            ))}
          </div>
        )}
      </div>

      {showRules && (
        <RulesModal
          onClose={() => setShowRules(false)}
          rules={checkersRules}
        />
      )}
    </div>
  );
}
