import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MAX_ANSWER_TEXT_LENGTH, toPollDurationHours, truncate } from '../discord/poll-limits.ts'

test('leaves text within the limit alone', () => {
    assert.equal(truncate('Paranoid Android', MAX_ANSWER_TEXT_LENGTH), 'Paranoid Android')
})

test('truncates long track names to the limit, ellipsis included', () => {
    const name = 'A'.repeat(80)
    const truncated = truncate(name, MAX_ANSWER_TEXT_LENGTH)

    assert.equal(truncated.length, MAX_ANSWER_TEXT_LENGTH)
    assert.equal(truncated.endsWith('…'), true)
})

test('keeps text that is exactly the limit', () => {
    const name = 'A'.repeat(MAX_ANSWER_TEXT_LENGTH)
    assert.equal(truncate(name, MAX_ANSWER_TEXT_LENGTH), name)
})

test('rounds a poll duration up to a whole hour', () => {
    assert.equal(toPollDurationHours(86_400_000), 24)
    assert.equal(toPollDurationHours(5_400_000), 2)
})

test('holds a poll shorter than an hour to Discord\'s minimum', () => {
    assert.equal(toPollDurationHours(120_000), 1)
    assert.equal(toPollDurationHours(0), 1)
})

test('caps a poll at the longest Discord allows', () => {
    assert.equal(toPollDurationHours(86_400_000 * 40), 768)
})
