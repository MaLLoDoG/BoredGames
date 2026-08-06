import { useReducer, useCallback } from 'react'
import { createGame, actionRoll, actionToggleHold, actionScoreNow, actionScore } from './engine'
import type { YachtState, Category } from './engine'

type Action =
  | { type: 'ROLL' }
  | { type: 'TOGGLE_HOLD'; dieId: number }
  | { type: 'SCORE_NOW' }
  | { type: 'SCORE'; category: Category }

function reducer(state: YachtState, action: Action): YachtState {
  switch (action.type) {
    case 'ROLL':        return actionRoll(state)
    case 'TOGGLE_HOLD': return actionToggleHold(state, action.dieId)
    case 'SCORE_NOW':   return actionScoreNow(state)
    case 'SCORE':       return actionScore(state, action.category)
    default:            return state
  }
}

export function useYacht(playerNames: string[]) {
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => createGame(playerNames)
  )

  return {
    state,
    roll:       useCallback(() => dispatch({ type: 'ROLL' }), []),
    toggleHold: useCallback((dieId: number) => dispatch({ type: 'TOGGLE_HOLD', dieId }), []),
    scoreNow:   useCallback(() => dispatch({ type: 'SCORE_NOW' }), []),
    score:      useCallback((category: Category) => dispatch({ type: 'SCORE', category }), []),
  }
}
