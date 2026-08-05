import { useReducer, useCallback } from 'react'
import {
  createGame,
  actionRoll,
  actionToggleHold,
  actionConfirmSetAside,
  actionBank,
  actionRollAgain,
  actionAcknowledgeFarkle,
  actionQuit,
} from './engine'
import type { FarkleState } from './engine'

type Action =
  | { type: 'ROLL' }
  | { type: 'TOGGLE_HOLD'; dieId: number }
  | { type: 'CONFIRM_SET_ASIDE' }
  | { type: 'BANK' }
  | { type: 'ROLL_AGAIN' }
  | { type: 'ACKNOWLEDGE_FARKLE' }
  | { type: 'QUIT' }

function reducer(state: FarkleState, action: Action): FarkleState {
  switch (action.type) {
    case 'ROLL':             return actionRoll(state)
    case 'TOGGLE_HOLD':      return actionToggleHold(state, action.dieId)
    case 'CONFIRM_SET_ASIDE': return actionConfirmSetAside(state)
    case 'BANK':             return actionBank(state)
    case 'ROLL_AGAIN':       return actionRollAgain(state)
    case 'ACKNOWLEDGE_FARKLE': return actionAcknowledgeFarkle(state)
    case 'QUIT':             return actionQuit(state)
    default:                 return state
  }
}

export function useFarkle(playerNames: string[], threeFarkleRule = true) {
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => createGame(playerNames, { threeFarkleRule })
  )

  return {
    state,
    roll:              useCallback(() => dispatch({ type: 'ROLL' }), []),
    toggleHold:        useCallback((dieId: number) => dispatch({ type: 'TOGGLE_HOLD', dieId }), []),
    confirmSetAside:   useCallback(() => dispatch({ type: 'CONFIRM_SET_ASIDE' }), []),
    bank:              useCallback(() => dispatch({ type: 'BANK' }), []),
    rollAgain:         useCallback(() => dispatch({ type: 'ROLL_AGAIN' }), []),
    acknowledgeFarkle: useCallback(() => dispatch({ type: 'ACKNOWLEDGE_FARKLE' }), []),
    quit:              useCallback(() => dispatch({ type: 'QUIT' }), []),
  }
}
