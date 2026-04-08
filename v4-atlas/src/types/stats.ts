export interface PlayerStats {
  vpip: number
  pfr: number
  threeBet: number
  af: number
  wtsd: number
  wsd: number
  steal: number
  foldToSteal: number
  cbetFlop: number
  cbetTurn: number
  cbetRiver: number
  checkRaiseFlop: number
  afFlop: number
  afRiver: number
  totalHands: number
}

export interface Insight {
  id: string
  icon: string
  title: string
  text: string
  border: string
}

export interface ScoutingText {
  [playerId: string]: string
}
