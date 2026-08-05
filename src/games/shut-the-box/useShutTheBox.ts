import { useReducer, useCallback } from 'react'
import {
  createGame,
  actionRoll,
  actionToggleTile,
  actionFlip,
  actionAdvance,
} from './engine'
import type { ShutTheBoxState, TileNumber } from './engine'

type Action =
  | { type: 'ROLL'; singleDie?: boolean }
  | { type: 'TOGGLE_TILE'; tile: TileNumber }
  | { type: 'FLIP' }
  | { type: 'ADVANCE' }

function reducer(state: ShutTheBoxState, action: Action): ShutTheBoxState {
  switch (action.type) {
    case 'ROLL':        return actionRoll(state, action.singleDie)
    case 'TOGGLE_TILE': return actionToggleTile(state, action.tile)
    case 'FLIP':        return actionFlip(state)
    case 'ADVANCE':     return actionAdvance(state)
    default:            return state
  }
}

export function useShutTheBox(playerNames: string[]) {
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => createGame(playerNames)
  )

  return {
    state,
    roll:        useCallback((singleDie?: boolean) => dispatch({ type: 'ROLL', singleDie }), []),
    toggleTile:  useCallback((tile: TileNumber) => dispatch({ type: 'TOGGLE_TILE', tile }), []),
    flip:        useCallback(() => dispatch({ type: 'FLIP' }), []),
    advance:     useCallback(() => dispatch({ type: 'ADVANCE' }), []),
  }
}
