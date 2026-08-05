import type { TileNumber } from '../engine'

interface TileProps {
  number: TileNumber
  open: boolean
  selected: boolean
  onToggle: () => void
  disabled: boolean
}

export default function Tile({ number, open, selected, onToggle, disabled }: TileProps) {
  let style = ''
  if (!open) {
    style = 'bg-slate-700 border-slate-600 text-slate-600 cursor-default scale-95'
  } else if (selected) {
    style = 'bg-yellow-400 border-yellow-300 text-slate-900 scale-110 shadow-lg shadow-yellow-500/40 cursor-pointer'
  } else if (disabled) {
    style = 'bg-slate-700 border-slate-600 text-slate-400 cursor-default'
  } else {
    style = 'bg-slate-200 border-slate-300 text-slate-900 hover:bg-yellow-100 hover:border-yellow-400 hover:scale-105 cursor-pointer'
  }

  return (
    <button
      onClick={disabled || !open ? undefined : onToggle}
      disabled={disabled || !open}
      aria-label={`Tile ${number}${!open ? ', closed' : selected ? ', selected' : ''}`}
      className={`
        w-12 h-14 sm:w-14 sm:h-16 rounded-xl border-2 font-extrabold text-xl
        transition-all duration-150 select-none flex items-center justify-center
        ${style}
      `}
    >
      {open ? number : '✓'}
    </button>
  )
}
