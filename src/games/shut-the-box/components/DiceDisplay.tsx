import type { DieValue } from '../engine'

const FACE_DOTS: Record<number, number[][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 22], [75, 22], [25, 50], [75, 50], [25, 78], [75, 78]],
}

interface DiceDisplayProps {
  dice: DieValue[]
  total: number
}

export default function DiceDisplay({ dice, total }: DiceDisplayProps) {
  if (dice.length === 0) return null

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-3">
        {dice.map((value, i) => {
          const dots = FACE_DOTS[value] ?? []
          return (
            <div
              key={i}
              className="relative w-14 h-14 rounded-xl border-2 bg-white border-slate-300"
            >
              {dots.map(([x, y], j) => (
                <span
                  key={j}
                  className="absolute w-2.5 h-2.5 rounded-full bg-slate-800"
                  style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)' }}
                />
              ))}
            </div>
          )
        })}
      </div>
      <div className="text-slate-300 text-sm font-semibold">
        Total: <span className="text-white text-lg font-bold">{total}</span>
      </div>
    </div>
  )
}
