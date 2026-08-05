import { useEffect, useRef } from 'react'

interface GameLogProps {
  entries: string[]
}

export default function GameLog({ entries }: GameLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries])

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 h-36 overflow-y-auto text-xs font-mono">
      {entries.length === 0 && (
        <p className="text-slate-600 italic">Game log will appear here...</p>
      )}
      {entries.map((entry, i) => (
        <div
          key={i}
          className={`py-0.5 ${i === entries.length - 1 ? 'text-yellow-300' : 'text-slate-400'}`}
        >
          {entry}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
