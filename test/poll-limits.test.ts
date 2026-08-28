import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MAX_ANSWER_TEXT_LENGTH, truncate } from '../discord/poll-limits.ts'

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
