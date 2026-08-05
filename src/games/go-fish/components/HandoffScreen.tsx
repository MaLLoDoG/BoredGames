// §9 — full-screen cover until the active player taps "I'm Ready"
// This is the core hidden-information mechanism for pass-and-play card games.

const PLAYER_COLORS = [
  { bg: 'from-yellow-500 to-orange-500', text: 'text-yellow-400', glow: 'shadow-yellow-500/40' },
  { bg: 'from-blue-500 to-cyan-500',    text: 'text-blue-400',   glow: 'shadow-blue-500/40'   },
  { bg: 'from-green-500 to-emerald-500',text: 'text-green-400',  glow: 'shadow-green-500/40'  },
  { bg: 'from-purple-500 to-pink-500',  text: 'text-purple-400', glow: 'shadow-purple-500/40' },
  { bg: 'from-red-500 to-rose-500',     text: 'text-red-400',    glow: 'shadow-red-500/40'    },
  { bg: 'from-indigo-500 to-violet-500',text: 'text-indigo-400', glow: 'shadow-indigo-500/40' },
]

interface HandoffScreenProps {
  playerName: string
  playerIndex: number
  onReady: () => void
}

export default function HandoffScreen({ playerName, playerIndex, onReady }: HandoffScreenProps) {
  const colors = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length]

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 px-8 gap-8">
      {/* Gradient wash */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-10 pointer-events-none`} />

      {/* Fish icon */}
      <div className="text-7xl select-none">🐟</div>

      {/* Message */}
      <div className="relative flex flex-col items-center gap-3 text-center">
        <p className="text-slate-400 text-lg font-semibold uppercase tracking-widest">
          Pass the device to
        </p>
        <h1 className={`text-5xl font-black ${colors.text} drop-shadow-lg`}>
          {playerName}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Don't show your cards to other players!
        </p>
      </div>

      {/* Ready button */}
      <button
        onClick={onReady}
        className={`
          relative z-10 mt-4 px-10 py-4 rounded-2xl
          bg-gradient-to-r ${colors.bg}
          text-white font-extrabold text-xl tracking-wide
          shadow-xl ${colors.glow}
          hover:scale-105 active:scale-95 transition-transform duration-150
        `}
      >
        I'm Ready — Show My Cards 🎴
      </button>
    </div>
  )
}
