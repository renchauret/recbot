import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createLogger } from '../util/logger.ts'

const NOW = new Date('2026-10-11T14:30:00.000Z')

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
        { method: 'log', args: ['2026-10-11T14:30:00.000Z', 'started'] },
        { method: 'warn', args: ['2026-10-11T14:30:00.000Z', 'shard disconnected'] },
        { method: 'error', args: ['2026-10-11T14:30:00.000Z', 'request failed'] }
    ])
})

test('passes every argument through untouched so errors keep their stack', () => {
    const { calls, sink } = recordingSink()
    const logger = createLogger(sink, () => NOW)
    const error = new Error('boom')

    logger.error(error, { guildId: '123' })

    assert.deepEqual(calls[0].args, ['2026-10-11T14:30:00.000Z', error, { guildId: '123' }])
    assert.equal(calls[0].args[1], error)
})

test('reads the clock on every call', () => {
    const { calls, sink } = recordingSink()
    let currentTime = NOW
    const logger = createLogger(sink, () => currentTime)

    logger.log('first')
    currentTime = new Date('2026-10-11T14:31:00.000Z')
    logger.log('second')

    assert.equal(calls[1].args[0], '2026-10-11T14:31:00.000Z')
})
