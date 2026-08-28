// Discord's limits on a poll message.
export const MAX_POLL_ANSWERS = 10
export const MAX_ANSWER_TEXT_LENGTH = 55
export const MAX_QUESTION_TEXT_LENGTH = 300

export const truncate = (text: string, maxLength: number): string =>
    text.length <= maxLength ? text : `${text.slice(0, maxLength - 1)}…`
