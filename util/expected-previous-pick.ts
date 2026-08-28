import { CronTime } from 'cron'

// Widening windows to search back through. The first one that contains an
// occurrence wins, which keeps the forward walk below short
const LOOKBACK_MS = [
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
export const getExpectedPreviousPick = (
    cronExpression: string,
    timeZone: string
): Date | null => {
    const cronTime = new CronTime(cronExpression, timeZone)
    const nowMs = (new Date().getTime())

    for (const lookbackMs of LOOKBACK_MS) {
        // find the first cron due date in the window
        let previous = cronTime.getNextDateFrom(new Date(nowMs - lookbackMs), timeZone).toMillis()
        if (previous > nowMs) {
            // Nothing due in this window, so widen it.
            continue
        }

        // check if there are more recent cron due dates in the window
        for (let step = 0; step < MAX_STEPS; step++) {
            const after = cronTime.getNextDateFrom(new Date(previous), timeZone).toMillis()
            // Guard against a schedule that reports no forward progress.
            if (after <= previous || after > nowMs) {
                break
            }
            previous = after
        }
        return new Date(previous)
    }

    return null
}
