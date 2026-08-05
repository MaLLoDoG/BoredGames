import Die from './Die'
import type { Die as DieType } from '../engine'

interface DiceRollerProps {
  dice: DieType[]
  onToggle: (id: number) => void
  canSelect: boolean
}

export default function DiceRoller({ dice, onToggle, canSelect }: DiceRollerProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {dice.map((die) => (
        <Die
          key={die.id}
          die={die}
          onToggle={() => onToggle(die.id)}
          disabled={!canSelect}
        />
      ))}
    </div>
  )
}
