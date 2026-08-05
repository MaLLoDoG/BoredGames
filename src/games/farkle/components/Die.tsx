import type { Die as DieType } from '../engine'

const FACE_DOTS: Record<number, number[][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 22], [75, 22], [25, 50], [75, 50], [25, 78], [75, 78]],
}

interface DieProps {
  die: DieType
  onToggle?: () => void
  disabled?: boolean
}

export default function Die({ die, onToggle, disabled }: DieProps) {
  const dots = FACE_DOTS[die.value] ?? []

  const base = 'relative w-14 h-14 rounded-xl border-2 transition-all duration-150 select-none'

  let style = ''
  if (die.setAside) {
    style = 'bg-slate-600 border-slate-500 opacity-60 cursor-default'
  } else if (die.held) {
    style = 'bg-yellow-400 border-yellow-300 scale-110 shadow-lg shadow-yellow-500/40 cursor-pointer'
  } else if (disabled) {
    style = 'bg-slate-700 border-slate-600 cursor-default'
  } else {
    style = 'bg-white border-slate-300 hover:border-yellow-400 hover:scale-105 cursor-pointer'
  }

  const dotColor = die.held ? 'bg-slate-900' : die.setAside ? 'bg-slate-400' : 'bg-slate-800'

  return (
    <button
      onClick={disabled || die.setAside ? undefined : onToggle}
      disabled={disabled || die.setAside}
      aria-label={`Die showing ${die.value}${die.setAside ? ', set aside' : die.held ? ', selected' : ''}`}
      className={`${base} ${style}`}
    >
      {dots.map(([x, y], i) => (
        <span
          key={i}
          className={`absolute w-2.5 h-2.5 rounded-full ${dotColor}`}
          style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
        />
      ))}
      {die.setAside && (
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          kept
        </span>
      )}
    </button>
  )
}
