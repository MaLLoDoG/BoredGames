import { useEffect, useRef } from 'react'

interface GameLogProps {
  entries: string[]
  /** Extra classes on the outer container, e.g. "mt-2" */
  className?: string
}

export default function GameLog({ entries, className = '' }: GameLogProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Scroll the log box itself, not the page
  useEffect(() => {
    const el = containerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [entries])

  return (
    <div
      ref={containerRef}
      className={`bg-slate-900 border border-slate-700 rounded-xl p-3 h-36 overflow-y-auto text-xs font-mono shrink-0 ${className}`}
    >
      {entries.length === 0 && (
        <p className="text-slate-600 italic">Game log will appear here…</p>
      )}
      {entries.map((entry, i) => (
        <div
          key={i}
          className={`py-0.5 ${i === entries.length - 1 ? 'text-yellow-300' : 'text-slate-400'}`}
        >
          {entry}
        </div>
      ))}
    </div>
  )
}
