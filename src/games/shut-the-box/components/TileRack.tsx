import Tile from './Tile'
import type { TileNumber } from '../engine'

interface TileRackProps {
  tiles: boolean[]
  selectedTiles: TileNumber[]
  onToggle: (t: TileNumber) => void
  canSelect: boolean
}

export default function TileRack({ tiles, selectedTiles, onToggle, canSelect }: TileRackProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {([1, 2, 3, 4, 5, 6, 7, 8, 9] as TileNumber[]).map((n) => (
        <Tile
          key={n}
          number={n}
          open={tiles[n]}
          selected={selectedTiles.includes(n)}
          onToggle={() => onToggle(n)}
          disabled={!canSelect}
        />
      ))}
    </div>
  )
}
