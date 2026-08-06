import type { Die as DieType } from '../engine'

interface DieProps {
  die: DieType
  onToggle?: () => void
  canHold: boolean
}

const FACE_DOTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 22], [75, 22], [25, 50], [75, 50], [25, 78], [75, 78]],
}

export default function Die({ die, onToggle, canHold }: DieProps) {
  const dots = FACE_DOTS[die.value] ?? []
  const held = die.held

  const baseClass = 'relative w-16 h-16 rounded-xl border-2 transition-all duration-150 select-none'
  let colorClass = ''
  // Only show held styling while holding is actually allowed
  if (held && canHold) {
    colorClass = 'bg-yellow-400 border-yellow-300 scale-110 shadow-lg shadow-yellow-400/50 cursor-pointer'
  } else if (canHold) {
    colorClass = 'bg-white border-slate-300 hover:border-yellow-400 hover:scale-105 cursor-pointer'
  } else {
    // After roll 3 or in scoring — show all dice as plain, equal, unclickable
    colorClass = 'bg-white border-slate-300 cursor-default'
  }

  const dotColor = (held && canHold) ? 'bg-slate-900' : 'bg-slate-800'

  return (
    <button
      onClick={canHold ? onToggle : undefined}
      disabled={!canHold}
      aria-label={`Die showing ${die.value}${held ? ', held' : ''}`}
      className={`${baseClass} ${colorClass}`}
    >
      {dots.map(([x, y], i) => (
        <span
          key={i}
          className={`absolute w-3 h-3 rounded-full ${dotColor}`}
          style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
        />
      ))}
      {held && canHold && (
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-yellow-400 uppercase tracking-widest whitespace-nowrap">
          held
        </span>
      )}
    </button>
  )
}
