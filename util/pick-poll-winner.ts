import { randomInt } from 'node:crypto'
import type { TrackPollAnswer } from '../models/track-poll.ts'

export type TalliedAnswer = TrackPollAnswer & { voteCount: number }

/**
 * The winning answer, or null if nobody voted. A tie is broken at random rather
 * than by album order, which would quietly favor openers every time.
 */
export const pickWinningAnswer = (
    answers: TalliedAnswer[],
    chooseIndex: (exclusiveMax: number) => number = exclusiveMax => randomInt(0, exclusiveMax)
): TalliedAnswer | null => {
    const mostVotes = answers.reduce((most, answer) => Math.max(most, answer.voteCount), 0)
    if (mostVotes === 0) {
        return null
    }

    const leaders = answers.filter(answer => answer.voteCount === mostVotes)
    return leaders.length === 1 ? leaders[0] : leaders[chooseIndex(leaders.length)]
}
