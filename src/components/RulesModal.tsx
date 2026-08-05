import { useEffect } from 'react'
import type { GameRules } from '../types/rules'

interface RulesModalProps {
  rules: GameRules
  onClose: () => void
}

export default function RulesModal({ rules, onClose }: RulesModalProps) {
  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Sheet / modal — stop click propagation so tapping inside doesn't close */}
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl
          shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700 shrink-0">
          <span className="text-3xl">{rules.emoji}</span>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-extrabold text-lg leading-tight">{rules.gameName}</h2>
            <p className="text-slate-400 text-sm leading-snug mt-0.5">{rules.summary}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close rules"
            className="ml-2 shrink-0 w-8 h-8 flex items-center justify-center rounded-full
              text-slate-400 hover:text-white hover:bg-slate-700 transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-5 py-5 flex flex-col gap-6">
          {rules.sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-yellow-400 font-bold text-sm uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <ul className="flex flex-col gap-1.5">
                {section.bullets.map((bullet, i) => (
                  <li key={i} className="flex gap-2 text-slate-300 text-sm leading-relaxed">
                    <span className="text-slate-600 shrink-0 mt-0.5">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 pt-2 border-t border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-700 text-slate-200 font-semibold rounded-xl
              hover:bg-slate-600 transition-colors text-sm"
          >
            Got it — close
          </button>
        </div>
      </div>
    </div>
  )
}
