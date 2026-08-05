export interface RulesSection {
  title: string
  bullets: string[]
}

export interface GameRules {
  gameId: string
  gameName: string
  emoji: string
  /** One-sentence hook shown in the lobby card and at the top of the modal */
  summary: string
  sections: RulesSection[]
}
