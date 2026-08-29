import type { TrackPollAnswer } from '../models/track-poll.ts'

export type TalliedAnswer = TrackPollAnswer & { voteCount: number }

/**
 * The winning answer, or null if nobody voted. A tie goes to the more popular
 * track on Spotify, then to whichever comes first on the album.
 */
export const pickWinningAnswer = (answers: TalliedAnswer[]): TalliedAnswer | null => {
    const mostVotes = answers.reduce((most, answer) => Math.max(most, answer.voteCount), 0)
    if (mostVotes === 0) {
        return null
    }

    return answers
        .filter(answer => answer.voteCount === mostVotes)
        .reduce((winner, answer) => (answer.popularity ?? 0) > (winner.popularity ?? 0) ? answer : winner)
}
