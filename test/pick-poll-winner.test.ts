import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pickWinningAnswer, type TalliedAnswer } from '../util/pick-poll-winner.ts'

const answer = (answerId: number, voteCount: number, popularity?: number): TalliedAnswer => ({
    answerId: answerId,
    trackName: `Track ${answerId}`,
    trackUri: `spotify:track:${answerId}`,
    popularity: popularity,
    voteCount: voteCount
})

test('picks the answer with the most votes', () => {
    const winner = pickWinningAnswer([answer(1, 2, 90), answer(2, 5, 10), answer(3, 1, 99)])
    assert.equal(winner?.trackName, 'Track 2')
    assert.equal(winner?.voteCount, 5)
})

test('returns null when nobody voted', () => {
    assert.equal(pickWinningAnswer([answer(1, 0), answer(2, 0)]), null)
})

test('returns null for a poll with no answers', () => {
    assert.equal(pickWinningAnswer([]), null)
})

test('breaks a tie with the more popular track', () => {
    const tied = [answer(1, 3, 40), answer(2, 1, 99), answer(3, 3, 70)]
    assert.equal(pickWinningAnswer(tied)?.trackName, 'Track 3')
})

test('breaks a tie in popularity by album order', () => {
    const tied = [answer(1, 3, 50), answer(2, 3, 50)]
    assert.equal(pickWinningAnswer(tied)?.trackName, 'Track 1')
})

test('treats a poll opened without popularity as least popular', () => {
    const tied = [answer(1, 3, undefined), answer(2, 3, 1)]
    assert.equal(pickWinningAnswer(tied)?.trackName, 'Track 2')
})
