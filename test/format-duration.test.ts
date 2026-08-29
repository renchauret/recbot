import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatDuration } from '../util/format-duration.ts'

test('describes a duration in its largest whole unit', () => {
    assert.equal(formatDuration(86_400_000), '24 hours')
    assert.equal(formatDuration(3_600_000), '1 hour')
    assert.equal(formatDuration(120_000), '2 minutes')
    assert.equal(formatDuration(60_000), '1 minute')
    assert.equal(formatDuration(30_000), '30 seconds')
})

test('falls back for a duration too short to name', () => {
    assert.equal(formatDuration(0), 'a moment')
})
