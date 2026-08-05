// Central registry mapping GameId → player-facing rules.
// Only games with rules.ts files are listed here.
// Import this wherever you need to look up rules by game ID.

import farkleRules from '../games/farkle/rules'
import shutTheBoxRules from '../games/shut-the-box/rules'
import connectFourRules from '../games/connect-four/rules'
import goFishRules from '../games/go-fish/rules'
import type { GameRules } from './rules'
import type { GameId } from './games'

export const GAME_RULES: Partial<Record<GameId, GameRules>> = {
  'farkle': farkleRules,
  'shut-the-box': shutTheBoxRules,
  'connect-four': connectFourRules,
  'go-fish': goFishRules,
}
