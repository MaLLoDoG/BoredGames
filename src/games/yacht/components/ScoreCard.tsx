import { CATEGORIES, CATEGORY_LABELS, scoreFor } from '../engine'
import type { Player, Die, Category } from '../engine'

interface ScoreCardProps {
  players: Player[]
  activeDice: Die[]
  phase: 'rolling' | 'scoring' | 'game-over'
  onScore?: (category: Category) => void
}

const UPPER: Category[] = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes']
const LOWER: Category[] = ['fullHouse', 'fourOfAKind', 'littleStraight', 'bigStraight', 'choice', 'yacht']

const PLAYER_COLORS = [
  'text-yellow-400',
  'text-blue-400',
  'text-green-400',
  'text-purple-400',
  'text-red-400',
  'text-indigo-400',
]

function CategoryRow({
  category,
  players,
  activeDice,
  canScore,
  onScore,
}: {
  category: Category
  players: Player[]
  activeDice: Die[]
  canScore: boolean
  onScore?: (c: Category) => void
}) {
  const potential = scoreFor(activeDice, category)

  return (
    <tr className="border-b border-slate-700/50 last:border-0">
      <td className="py-1 pr-2 text-slate-300 text-xs whitespace-nowrap">
        {CATEGORY_LABELS[category]}
      </td>
      {players.map((p, i) => {
        const scored = p.scoreCard[category]
        const isActive = canScore && scored === null
        return (
          <td key={p.id} className="py-1 text-center w-12">
            {scored !== null ? (
              <span className={`text-xs font-semibold ${PLAYER_COLORS[i % PLAYER_COLORS.length]}`}>
                {scored}
              </span>
            ) : isActive ? (
              <button
                onClick={() => onScore?.(category)}
                className="w-9 h-6 rounded-md bg-slate-700 hover:bg-yellow-400 hover:text-slate-900
                  text-yellow-300 text-xs font-bold transition-all duration-150 border border-slate-600
                  hover:border-yellow-400 hover:scale-105"
              >
                {potential}
              </button>
            ) : (
              <span className="text-slate-600 text-xs">—</span>
            )}
          </td>
        )
      })}
    </tr>
  )
}

export default function ScoreCard({ players, activeDice, phase, onScore }: ScoreCardProps) {
  const canScore = phase === 'scoring'

  function SectionHeader({ label }: { label: string }) {
    return (
      <tr>
        <td
          colSpan={players.length + 1}
          className="pt-2 pb-0.5 text-xs font-bold uppercase tracking-widest text-slate-500"
        >
          {label}
        </td>
      </tr>
    )
  }

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
      <table className="w-full px-4">
        <thead>
          <tr className="border-b border-slate-600">
            <th className="py-1.5 px-3 text-left text-xs text-slate-500 font-semibold uppercase tracking-wide">
              Category
            </th>
            {players.map((p, i) => (
              <th key={p.id} className={`py-1.5 text-center text-xs font-bold uppercase tracking-wide ${PLAYER_COLORS[i % PLAYER_COLORS.length]}`}>
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="px-4">
          <SectionHeader label="Upper" />
          {UPPER.map(cat => (
            <CategoryRow
              key={cat}
              category={cat}
              players={players}
              activeDice={activeDice}
              canScore={canScore}
              onScore={onScore}
            />
          ))}
          {/* Upper totals */}
          <tr className="border-t border-slate-600">
            <td className="py-1 pr-2 text-slate-500 text-xs italic">Upper total</td>
            {players.map((p, i) => {
              const total = (['ones','twos','threes','fours','fives','sixes'] as Category[])
                .reduce((s, c) => s + (p.scoreCard[c] ?? 0), 0)
              return (
                <td key={p.id} className={`py-1 text-center text-xs font-semibold ${PLAYER_COLORS[i % PLAYER_COLORS.length]}`}>
                  {total}
                </td>
              )
            })}
          </tr>

          <SectionHeader label="Lower" />
          {LOWER.map(cat => (
            <CategoryRow
              key={cat}
              category={cat}
              players={players}
              activeDice={activeDice}
              canScore={canScore}
              onScore={onScore}
            />
          ))}
        </tbody>
        {/* Grand total */}
        <tfoot>
          <tr className="border-t-2 border-slate-600 bg-slate-900/50">
            <td className="py-1.5 px-3 text-slate-300 text-xs font-bold">Total</td>
            {players.map((p, i) => {
              const total = CATEGORIES.reduce((s, c) => s + (p.scoreCard[c] ?? 0), 0)
              return (
                <td key={p.id} className={`py-1.5 text-center text-sm font-extrabold ${PLAYER_COLORS[i % PLAYER_COLORS.length]}`}>
                  {total}
                </td>
              )
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
