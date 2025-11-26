export type Config = {
    pickRecCron: string,
    promptDiscussionCron: string,
    reminderCron: string
}

const prodConfig: Config = {
    pickRecCron: '0 0 21 * * 5',
    promptDiscussionCron: '0 0 16 * * 5',
    reminderCron: '0 0 16 * * 3'
}

const devConfig: Config = {
    pickRecCron: '0 * * * * *',
    promptDiscussionCron: '30 * * * * *',
    reminderCron: '10 * * * * *'
}

export const getConfig = (): Config => process.env.NODE_ENV === 'development'
    ? devConfig
    : prodConfig
