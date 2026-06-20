// A Squares game has no separate "complete" action — it completes the moment the
// host enters the FINAL period score (the winning square is decided on the final
// digits). The explicit "Complete game" button therefore just guards that: if the
// game can't complete yet, it returns an audit explaining why + what to do.

export interface SquaresCompleteAudit { blockers: string[]; hint?: string }

/** Returns the audit (why it can't complete), or null if there's nothing to block. */
export function squaresCompleteAudit(status: string, finalScored: boolean): SquaresCompleteAudit | null {
  if (status === 'registration') {
    return { blockers: ['The board isn’t locked yet — claiming is still open.'], hint: 'Lock the board (assign the digits) first, then enter the period scores.' }
  }
  if (status === 'live' && !finalScored) {
    return { blockers: ['The Final score isn’t in yet — that’s what completes the game.'], hint: 'Enter the Final period score above; the winning square is decided on the final digits.' }
  }
  return null
}
