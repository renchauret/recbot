type Sink = Pick<Console, 'log' | 'warn' | 'error'>

type Write = (...args: unknown[]) => void

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
    log: (...args) => sink.log(now().toISOString(), ...args),
    warn: (...args) => sink.warn(now().toISOString(), ...args),
    error: (...args) => sink.error(now().toISOString(), ...args)
})

export const logger = createLogger()
