// Discord's limits on a poll message.
export const MAX_POLL_ANSWERS = 10
export const MAX_ANSWER_TEXT_LENGTH = 55
export const MAX_QUESTION_TEXT_LENGTH = 300

const HOUR_MS = 3_600_000
const MIN_DURATION_HOURS = 1
const MAX_DURATION_HOURS = 768

/**
 * A poll duration Discord will accept: whole hours, at least one and at most 32
 * days. A shorter poll has to be ended early instead.
 */
export const toPollDurationHours = (durationMs: number): number =>
    Math.min(MAX_DURATION_HOURS, Math.max(MIN_DURATION_HOURS, Math.ceil(durationMs / HOUR_MS)))

export const truncate = (text: string, maxLength: number): string =>
    text.length <= maxLength ? text : `${text.slice(0, maxLength - 1)}…`
