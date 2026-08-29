export type Config = {
    pickRecCron: string,
    promptDiscussionCron: string,
    reminderCron: string,
    tallyTrackPollCron: string,
    // Discord won't schedule a poll for less than an hour. Anything shorter is
    // held to this by ending the poll early instead.
    pollDurationMs: number
}

const prodConfig: Config = {
    pickRecCron: '0 0 21 * * 5',
    promptDiscussionCron: '0 0 16 * * 5',
    reminderCron: '0 0 16 * * 3',
    tallyTrackPollCron: '0 */15 * * * *',
    pollDurationMs: 86_400_000
}

const devConfig: Config = {
    pickRecCron: '0 * * * * *',
    promptDiscussionCron: '30 * * * * *',
    reminderCron: '10 * * * * *',
    tallyTrackPollCron: '*/20 * * * * *',
    pollDurationMs: 120_000
}

export const getConfig = (): Config => process.env.NODE_ENV === 'development'
    ? devConfig
    : prodConfig
