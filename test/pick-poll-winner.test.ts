import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pickWinningAnswer, type TalliedAnswer } from '../util/pick-poll-winner.ts'

const answer = (answerId: number, voteCount: number): TalliedAnswer => ({
    answerId: answerId,
    trackName: `Track ${answerId}`,
    trackUri: `spotify:track:${answerId}`,
    voteCount: voteCount
})

test('picks the answer with the most votes', () => {
    const winner = pickWinningAnswer([answer(1, 2), answer(2, 5), answer(3, 1)])
    assert.equal(winner?.trackName, 'Track 2')
    assert.equal(winner?.voteCount, 5)
})

test('returns null when nobody voted', () => {
    assert.equal(pickWinningAnswer([answer(1, 0), answer(2, 0)]), null)
})

test('returns null for a poll with no answers', () => {
    assert.equal(pickWinningAnswer([]), null)
})

test('draws a tie at random from the tied answers only', () => {
    const tied = [answer(1, 3), answer(2, 1), answer(3, 3)]
    const drawnFrom: number[] = []
    const chooseIndex = (exclusiveMax: number) => {
        drawnFrom.push(exclusiveMax)
        return 1
    }

    assert.equal(pickWinningAnswer(tied, chooseIndex)?.trackName, 'Track 3')
    assert.deepEqual(drawnFrom, [2])
})

test('does not draw at random when there is a single leader', () => {
    const chooseIndex = () => {
        throw new Error('should not draw')
    }
    assert.equal(pickWinningAnswer([answer(1, 4), answer(2, 1)], chooseIndex)?.trackName, 'Track 1')
})
