import { useState } from 'react';
import { useCheckers } from './useCheckers';
import RulesModal from '../../components/RulesModal';
import { checkersRules } from './rules';
import type { Cell, Player } from './engine';

interface CheckersProps {
  players: string[];
  onQuit: () => void;
}

// Piece rendered as a styled circle so it fills the square properly
function Piece({ cell, isSelected, hasCapture }: { cell: Cell; isSelected: boolean; hasCapture: boolean }) {
  const isRed = cell === 'r' || cell === 'R';
  const isKing = cell === 'R' || cell === 'B';

  const outerRing = isSelected
    ? 'ring-4 ring-yellow-300 ring-offset-1'
    : hasCapture
      ? 'ring-2 ring-orange-400 ring-offset-1'
      : '';

  const bg = isRed
    ? 'bg-red-500 border-red-700'
    : 'bg-stone-700 border-stone-900';

  return (
    <div className={`
      w-4/5 h-4/5 rounded-full border-2 flex items-center justify-center
      ${bg} ${outerRing} select-none
    `}>
      {isKing && (
        <span className="text-yellow-300 font-bold leading-none" style={{ fontSize: '1.1em' }}>♛</span>
      )}
    </div>
  );
}

export function Checkers({ players, onQuit }: CheckersProps) {
  const { state, select, deselect, move, chain, resign, offerDraw, acceptDraw, declineDraw, reset } = useCheckers();
  const [showRules, setShowRules] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [confirmResign, setConfirmResign] = useState(false);

  const { board, current, phase, selected, legalMoves, winner, drawOfferedBy, log } = state;

  // Build forced capture set — pieces the current player MUST move from (orange ring)
  const forcedPieces: Set<number> = new Set();
  if (phase === 'select') {
    // Re-derive which own pieces have captures by checking legalMoves would be non-empty for captures
    // We store this by checking the engine's allCaptures logic inline here
    let anyCapture = false;
    const tempCaptures: number[] = [];
    for (let i = 0; i < 64; i++) {
      const cell = board[i];
      if (!cell) continue;
      const isOwn = current === 'red' ? (cell === 'r' || cell === 'R') : (cell === 'b' || cell === 'B');
      if (!isOwn) continue;
      // Check each diagonal for a capture
      const pieceCaptures: number[] = [];
      const row = Math.floor(i / 8);
      const col = i % 8;
      const moveDirs: [number, number][] =
        cell === 'r' ? [[-1, -1], [-1, 1]] :
        cell === 'b' ? [[1, -1], [1, 1]] :
        [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      for (const [dr, dc] of moveDirs) {
        const mr = row + dr; const mc = col + dc;
        const lr = row + dr * 2; const lc = col + dc * 2;
        if (lr < 0 || lr > 7 || lc < 0 || lc > 7) continue;
        const mid = board[mr * 8 + mc];
        const land = board[lr * 8 + lc];
        const isEnemy = mid !== null && (
          current === 'red' ? (mid === 'b' || mid === 'B') : (mid === 'r' || mid === 'R')
        );
        if (isEnemy && land === null) pieceCaptures.push(lr * 8 + lc);
      }
      if (pieceCaptures.length > 0) {
        anyCapture = true;
        tempCaptures.push(i);
      }
    }
    if (anyCapture) tempCaptures.forEach(i => forcedPieces.add(i));
  }

  const redName = players[0] ?? 'Red';
  const blackName = players[1] ?? 'Black';
  function playerName(p: Player) {
    return p === 'red' ? redName : blackName;
  }

  function handleSquareClick(idx: number) {
    if (phase === 'game-over') return;
    const row = Math.floor(idx / 8);
    const col = idx % 8;
    // Ignore light squares entirely
    if ((row + col) % 2 === 0) return;

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
        deselect();
      } else if (legalMoves.includes(idx)) {
        move(idx);
      } else if (isOwn) {
        // Try re-selecting — engine will enforce forced-capture rule
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
    if (idx === selected) return 'bg-yellow-500';
    if (legalMoves.includes(idx)) {
      // Capture destination = brighter green, simple move = softer green
      const isCapture = phase === 'move' || phase === 'chain'
        ? Math.abs(Math.floor(idx / 8) - Math.floor((selected ?? idx) / 8)) === 2
        : false;
      return isCapture ? 'bg-emerald-400' : 'bg-green-700';
    }
    return 'bg-amber-800';
  }

  // Cursor hint
  function squareCursor(row: number, col: number, idx: number): string {
    const isDark = (row + col) % 2 === 1;
    if (!isDark || phase === 'game-over') return 'cursor-default';
    const cell = board[idx];
    const isOwn = current === 'red'
      ? (cell === 'r' || cell === 'R')
      : (cell === 'b' || cell === 'B');
    if (phase === 'select' && isOwn) return 'cursor-pointer';
    if (phase === 'move' && (legalMoves.includes(idx) || isOwn || idx === selected)) return 'cursor-pointer';
    if (phase === 'chain' && legalMoves.includes(idx)) return 'cursor-pointer';
    return 'cursor-default';
  }

  const currentName = playerName(current);
  const isDrawOfferedToMe = drawOfferedBy !== null && drawOfferedBy !== current;
  const hasForcedCaptures = forcedPieces.size > 0;

  return (
    <div className="min-h-screen flex flex-col bg-amber-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-amber-900 text-amber-50">
        <button onClick={onQuit} className="text-sm underline">← Lobby</button>
        <h1 className="font-bold text-lg">Checkers</h1>
        <button onClick={() => setShowRules(true)} className="text-sm underline">📖 Rules</button>
      </div>

      {/* Status bar */}
      <div className="px-4 py-2 bg-amber-800 text-amber-50 text-center text-sm font-medium flex items-center justify-center gap-3 min-h-[2.5rem]">
        <span>
          {phase === 'game-over' ? (
            winner === 'draw'
              ? `Draw${state.drawReason ? ` — ${state.drawReason}` : ''}!`
              : `🏆 ${playerName(winner!)} wins!`
          ) : phase === 'chain' ? (
            `${currentName} — keep jumping! 🔥`
          ) : phase === 'move' ? (
            `${currentName} — tap a green square to move`
          ) : hasForcedCaptures ? (
            `${currentName} — you must capture! (orange pieces)`
          ) : (
            `${currentName}'s turn — tap a piece`
          )}
        </span>
        {phase === 'move' && (
          <button
            onClick={deselect}
            className="text-xs px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white shrink-0"
          >
            ✕ Cancel
          </button>
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
        <div
          className="grid grid-cols-8 border-2 border-amber-900"
          style={{ width: 'min(92vw, 480px)', height: 'min(92vw, 480px)' }}
        >
          {Array.from({ length: 64 }, (_, idx) => {
            const row = Math.floor(idx / 8);
            const col = idx % 8;
            const cell = board[idx];
            const isDark = (row + col) % 2 === 1;
            const isLegalDest = legalMoves.includes(idx);
            const isForced = forcedPieces.has(idx);
            const isSelected = idx === selected;
            return (
              <div
                key={idx}
                onClick={() => handleSquareClick(idx)}
                className={`
                  flex items-center justify-center relative
                  ${squareBg(row, col, idx)}
                  ${squareCursor(row, col, idx)}
                `}
                style={{ aspectRatio: '1' }}
              >
                {cell ? (
                  <Piece
                    cell={cell}
                    isSelected={isSelected}
                    hasCapture={isForced && !isSelected}
                  />
                ) : isLegalDest && isDark ? (
                  // Destination dot — larger and more visible
                  <span className="w-1/3 h-1/3 rounded-full bg-green-300 opacity-90 block" />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Player legend */}
      <div className="flex justify-center gap-8 px-4 pb-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-red-700" />
          <span className={current === 'red' && phase !== 'game-over' ? 'font-bold' : 'text-gray-600'}>
            {redName}
            {current === 'red' && phase !== 'game-over' && ' ← turn'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-stone-700 border-2 border-stone-900" />
          <span className={current === 'black' && phase !== 'game-over' ? 'font-bold' : 'text-gray-600'}>
            {blackName}
            {current === 'black' && phase !== 'game-over' && ' ← turn'}
          </span>
        </div>
      </div>

      {/* King legend */}
      <div className="text-center text-xs text-amber-700 pb-2">
        ♛ = King &nbsp;·&nbsp; <span className="inline-block w-3 h-3 rounded-full ring-2 ring-orange-400 bg-red-500 align-middle" /> = must capture
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-2 px-4 py-3">
        {phase !== 'game-over' && !confirmResign && (
          <>
            {!isDrawOfferedToMe && drawOfferedBy === null && (
              <button
                onClick={offerDraw}
                className="px-3 py-1.5 rounded bg-blue-500 text-white text-sm"
              >
                🤝 Offer Draw
              </button>
            )}
            <button
              onClick={() => setConfirmResign(true)}
              className="px-3 py-1.5 rounded bg-gray-500 text-white text-sm"
            >
              😤 Flip Board
            </button>
          </>
        )}
        {/* Inline resign confirm — no native dialog */}
        {confirmResign && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-300 rounded px-3 py-2 text-sm">
            <span className="text-red-700">{currentName} resigns?</span>
            <button
              onClick={() => { resign(); setConfirmResign(false); }}
              className="px-3 py-1 bg-red-600 text-white rounded text-xs"
            >
              Yes, flip it
            </button>
            <button
              onClick={() => setConfirmResign(false)}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs"
            >
              Cancel
            </button>
          </div>
        )}
        {phase === 'game-over' && (
          <button onClick={reset} className="px-4 py-2 rounded bg-amber-700 text-white font-medium">
            Play Again
          </button>
        )}
        <button onClick={onQuit} className="px-3 py-1.5 rounded bg-gray-300 text-gray-700 text-sm">
          I Quit
        </button>
      </div>

      {/* Game log toggle */}
      <div className="px-4 pb-6">
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
