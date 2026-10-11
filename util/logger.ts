type Sink = Pick<Console, 'log' | 'warn' | 'error'>

type Write = (...args: unknown[]) => void

const pad = (value: number, length = 2) => String(value).padStart(length, '0')

/**
 * Local time, since the bot is read from a terminal on the machine it runs on.
 */
export const formatTimestamp = (date: Date): string =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`

export type Logger = {
    log: Write,
    warn: Write,
    error: Write
}

/**
 * Built with its dependencies passed in so tests can capture output and fix the
 * clock.
 */
export const createLogger = (
    sink: Sink = console,
    now: () => Date = () => new Date()
): Logger => ({
    log: (...args) => sink.log(formatTimestamp(now()), ...args),
    warn: (...args) => sink.warn(formatTimestamp(now()), ...args),
    error: (...args) => sink.error(formatTimestamp(now()), ...args)
})

export const logger = createLogger()
