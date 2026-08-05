import type { Rank } from '../engine'

interface BookShelfProps {
  books: Rank[]
  playerName: string
  colorClass: string
}

const SUIT_SYMBOLS = ['♠', '♥', '♦', '♣']

export default function BookShelf({ books, playerName, colorClass }: BookShelfProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className={`text-xs font-bold uppercase tracking-wide ${colorClass}`}>
        {playerName} — {books.length} book{books.length !== 1 ? 's' : ''}
      </span>
      {books.length === 0 ? (
        <span className="text-slate-600 text-xs italic">No books yet</span>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {books.map(rank => (
            <div
              key={rank}
              className="flex items-center gap-0.5 bg-slate-700 rounded-lg px-2 py-1 border border-slate-600"
            >
              <span className="text-white font-bold text-sm">{rank}</span>
              <span className="text-slate-400 text-xs">{SUIT_SYMBOLS.join('')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
