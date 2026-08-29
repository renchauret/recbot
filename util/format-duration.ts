const UNITS: [name: string, ms: number][] = [
    ['hour', 3_600_000],
    ['minute', 60_000],
    ['second', 1_000]
]

/**
 * A duration in the largest whole unit that fits, for telling the club how long
 * a poll stays open.
 */
export const formatDuration = (durationMs: number): string => {
    for (const [name, unitMs] of UNITS) {
        if (durationMs >= unitMs) {
            const count = Math.round(durationMs / unitMs)
            return `${count} ${name}${count === 1 ? '' : 's'}`
        }
    }
    return 'a moment'
}
