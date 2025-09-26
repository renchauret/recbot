import { configDotenv } from 'dotenv'
import { startPickRecJob } from './cron/pick-rec.ts'
import { startPromptDiscussionJob } from './cron/prompt-discussion.ts'
import { initDiscordClient } from './discord/discord-client.ts'

const init = () => {
    configDotenv()
    // connectDb()
    initDiscordClient()
    startPickRecJob()
    startPromptDiscussionJob()
}

init()
