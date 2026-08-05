import { useEffect, useState } from 'react'

interface PlayerTransitionProps {
  playerName: string
  playerIndex: number
  visible: boolean
  onDone: () => void
}

const PLAYER_COLORS = [
  'from-yellow-500 to-orange-500',
  'from-blue-500 to-cyan-500',
  'from-green-500 to-emerald-500',
  'from-purple-500 to-pink-500',
  'from-red-500 to-rose-500',
  'from-indigo-500 to-violet-500',
]

export default function PlayerTransition({ playerName, playerIndex, visible, onDone }: PlayerTransitionProps) {
  const [animating, setAnimating] = useState(false)
  const color = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length]

  useEffect(() => {
    if (!visible) return
    setAnimating(true)
    const timer = setTimeout(() => {
      setAnimating(false)
      onDone()
    }, 1600)
    return () => clearTimeout(timer)
  }, [visible, onDone])

  if (!visible && !animating) return null

  return (
    <div
      className={`
        fixed inset-0 z-50 flex flex-col items-center justify-center
        bg-slate-900/90 backdrop-blur-sm
        transition-opacity duration-300
        ${animating ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* Colour flash ring */}
      <div className={`
        absolute inset-0 bg-gradient-to-br ${color} opacity-20
        animate-pulse
      `} />

      {/* Content */}
      <div className="relative flex flex-col items-center gap-4 text-center px-8">
        <div
          className={`
            text-8xl font-black tracking-tighter
            bg-gradient-to-br ${color} bg-clip-text text-transparent
            drop-shadow-2xl
            animate-bounce
          `}
          style={{ animationDuration: '0.6s' }}
        >
          {playerName}
        </div>

        <div className="text-2xl font-bold text-white opacity-80 uppercase tracking-widest">
          Your Turn!
        </div>

        <div className={`
          mt-2 h-1.5 w-32 rounded-full bg-gradient-to-r ${color}
          animate-pulse
        `} />
      </div>
    </div>
  )
}
