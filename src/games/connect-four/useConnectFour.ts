import { useReducer, useCallback } from 'react'
import { createGame, actionDrop, actionQuit } from './engine'
import type { ConnectFourState } from './engine'

type Action =
  | { type: 'DROP'; col: number }
  | { type: 'QUIT' }

function reducer(state: ConnectFourState, action: Action): ConnectFourState {
  switch (action.type) {
    case 'DROP': return actionDrop(state, action.col)
    case 'QUIT': return actionQuit(state)
    default:     return state
  }
}

export function useConnectFour(player1Name: string, player2Name: string) {
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => createGame(player1Name, player2Name)
  )

  return {
    state,
    drop: useCallback((col: number) => dispatch({ type: 'DROP', col }), []),
    quit: useCallback(() => dispatch({ type: 'QUIT' }), []),
  }
}
