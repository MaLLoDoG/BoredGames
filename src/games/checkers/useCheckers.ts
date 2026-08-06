import { useReducer, useCallback } from 'react';
import {
  initialState,
  actionSelect,
  actionMove,
  actionContinueChain,
  actionResign,
  actionOfferDraw,
  actionAcceptDraw,
  actionDeclineDraw,
} from './engine';
import type { CheckersState } from './engine';

type Action =
  | { type: 'select'; idx: number }
  | { type: 'move'; idx: number }
  | { type: 'chain'; idx: number }
  | { type: 'resign' }
  | { type: 'offerDraw' }
  | { type: 'acceptDraw' }
  | { type: 'declineDraw' }
  | { type: 'reset' };

function reducer(state: CheckersState, action: Action): CheckersState {
  switch (action.type) {
    case 'select': return actionSelect(state, action.idx);
    case 'move': return actionMove(state, action.idx);
    case 'chain': return actionContinueChain(state, action.idx);
    case 'resign': return actionResign(state);
    case 'offerDraw': return actionOfferDraw(state);
    case 'acceptDraw': return actionAcceptDraw(state);
    case 'declineDraw': return actionDeclineDraw(state);
    case 'reset': return initialState();
    default: return state;
  }
}

export function useCheckers() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  const select = useCallback((idx: number) => dispatch({ type: 'select', idx }), []);
  const move = useCallback((idx: number) => dispatch({ type: 'move', idx }), []);
  const chain = useCallback((idx: number) => dispatch({ type: 'chain', idx }), []);
  const resign = useCallback(() => dispatch({ type: 'resign' }), []);
  const offerDraw = useCallback(() => dispatch({ type: 'offerDraw' }), []);
  const acceptDraw = useCallback(() => dispatch({ type: 'acceptDraw' }), []);
  const declineDraw = useCallback(() => dispatch({ type: 'declineDraw' }), []);
  const reset = useCallback(() => dispatch({ type: 'reset' }), []);

  return { state, select, move, chain, resign, offerDraw, acceptDraw, declineDraw, reset };
}
