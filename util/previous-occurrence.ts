import { CronTime } from 'cron'

// Widening windows to search back through. The first one that contains an
// occurrence wins, which keeps the forward walk below short: a per-minute
// schedule resolves within the hour, a weekly one within eight days.
const LOOKBACK_MS = [
    3_600_000,        // 1 hour
    86_400_000,       // 1 day
    691_200_000,      // 8 days
    2_764_800_000,    // 32 days
    34_560_000_000    // 400 days
]

const MAX_STEPS = 100_000

/**
 * The most recent time a cron expression was due at or before `now`, or null if
 * it was never due within the search window. The cron package only computes
 * forward, so this finds a start point far enough back to contain an occurrence
 * and then walks forward to the last one that has already passed.
 */
export const getPreviousOccurrence = (
    cronExpression: string,
    timeZone: string,
    now: Date = new Date()
): Date | null => {
    const cronTime = new CronTime(cronExpression, timeZone)
    const nowMs = now.getTime()

    for (const lookbackMs of LOOKBACK_MS) {
        let next = cronTime.getNextDateFrom(new Date(nowMs - lookbackMs), timeZone).toMillis()
        if (next > nowMs) {
            // Nothing due in this window, so widen it.
            continue
        }

        let previous = next
        for (let step = 0; step < MAX_STEPS; step++) {
            const after = cronTime.getNextDateFrom(new Date(next), timeZone).toMillis()
            // Guard against a schedule that reports no forward progress.
            if (after <= next || after > nowMs) {
                break
            }
            previous = after
            next = after
        }
        return new Date(previous)
    }

    return null
}
