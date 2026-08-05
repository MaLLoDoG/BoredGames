import { useReducer, useCallback } from 'react'
import { createGame, actionReady, actionAsk, actionContinueTurn, actionEndFishTurn, actionQuit } from './engine'
import type { GoFishState, Rank } from './engine'

type Action =
  | { type: 'READY' }
  | { type: 'ASK'; targetIndex: number; rank: Rank }
  | { type: 'CONTINUE_TURN' }
  | { type: 'END_FISH_TURN' }
  | { type: 'QUIT'; playerIndex: number }

function reducer(state: GoFishState, action: Action): GoFishState {
  switch (action.type) {
    case 'READY':        return actionReady(state)
    case 'ASK':          return actionAsk(state, action.targetIndex, action.rank)
    case 'CONTINUE_TURN':return actionContinueTurn(state)
    case 'END_FISH_TURN':return actionEndFishTurn(state)
    case 'QUIT':         return actionQuit(state, action.playerIndex)
    default:             return state
  }
}

export function useGoFish(playerNames: string[]) {
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => createGame(playerNames)
  )

  return {
    state,
    ready:       useCallback(() => dispatch({ type: 'READY' }), []),
    ask:         useCallback((targetIndex: number, rank: Rank) => dispatch({ type: 'ASK', targetIndex, rank }), []),
    continueTurn:useCallback(() => dispatch({ type: 'CONTINUE_TURN' }), []),
    endFishTurn: useCallback(() => dispatch({ type: 'END_FISH_TURN' }), []),
    quit:        useCallback((playerIndex: number) => dispatch({ type: 'QUIT', playerIndex }), []),
  }
}
