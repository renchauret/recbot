export type Config = {
    pickRecCron: string,
    promptDiscussionCron: string
}

const prodConfig: Config = {
    pickRecCron: '0 10 17 * * 5',
    promptDiscussionCron: '0 0 16 * * 5'
}
const devConfig: Config = {
    pickRecCron: '0 * * * * *',
    promptDiscussionCron: '30 * * * * *'
}

export const getConfig = (): Config => process.env.NODE_ENV === 'development'
    ? devConfig
    : prodConfig
