import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createLogger, formatTimestamp } from '../util/logger.ts'

// Built from local parts so the expected strings hold in any time zone.
const NOW = new Date(2026, 9, 11, 14, 30, 0, 0)

/**
 * A console stand-in that records what each method was called with.
 */
const recordingSink = () => {
    const calls: { method: string, args: unknown[] }[] = []
    const record = (method: string) => (...args: unknown[]) => {
        calls.push({ method, args })
    }
    return { calls, sink: { log: record('log'), warn: record('warn'), error: record('error') } }
}

test('prefixes each level with the current time and keeps it on the same stream', () => {
    const { calls, sink } = recordingSink()
    const logger = createLogger(sink, () => NOW)

    logger.log('started')
    logger.warn('shard disconnected')
    logger.error('request failed')

    assert.deepEqual(calls, [
        { method: 'log', args: ['2026-10-11 14:30:00.000', 'started'] },
        { method: 'warn', args: ['2026-10-11 14:30:00.000', 'shard disconnected'] },
        { method: 'error', args: ['2026-10-11 14:30:00.000', 'request failed'] }
    ])
})

test('passes every argument through untouched so errors keep their stack', () => {
    const { calls, sink } = recordingSink()
    const logger = createLogger(sink, () => NOW)
    const error = new Error('boom')

    logger.error(error, { guildId: '123' })

    assert.deepEqual(calls[0].args, ['2026-10-11 14:30:00.000', error, { guildId: '123' }])
    assert.equal(calls[0].args[1], error)
})

test('reads the clock on every call', () => {
    const { calls, sink } = recordingSink()
    let currentTime = NOW
    const logger = createLogger(sink, () => currentTime)

    logger.log('first')
    currentTime = new Date(2026, 9, 11, 14, 31, 0, 0)
    logger.log('second')

    assert.equal(calls[1].args[0], '2026-10-11 14:31:00.000')
})

test('formats the timestamp in local time with zero padding', () => {
    assert.equal(formatTimestamp(new Date(2026, 0, 5, 3, 7, 9, 4)), '2026-01-05 03:07:09.004')
    assert.equal(formatTimestamp(new Date(2026, 11, 31, 23, 59, 59, 999)), '2026-12-31 23:59:59.999')
})
