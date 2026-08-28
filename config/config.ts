export type Config = {
    pickRecCron: string,
    promptDiscussionCron: string,
    reminderCron: string,
    tallyTrackPollCron: string,
    pollDurationHours: number,
    // Discord won't schedule a poll for less than an hour, so development ends
    // them early instead of waiting one out. Null leaves polls alone.
    endPollsEarlyAfterMs: number | null
}

const prodConfig: Config = {
    pickRecCron: '0 0 21 * * 5',
    promptDiscussionCron: '0 0 16 * * 5',
    reminderCron: '0 0 16 * * 3',
    tallyTrackPollCron: '0 */15 * * * *',
    pollDurationHours: 24,
    endPollsEarlyAfterMs: null
}

const devConfig: Config = {
    pickRecCron: '0 * * * * *',
    promptDiscussionCron: '30 * * * * *',
    reminderCron: '10 * * * * *',
    tallyTrackPollCron: '*/20 * * * * *',
    pollDurationHours: 1,
    endPollsEarlyAfterMs: 120_000
}

export const getConfig = (): Config => process.env.NODE_ENV === 'development'
    ? devConfig
    : prodConfig
