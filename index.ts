import { configDotenv } from 'dotenv'
import { startPickRecJob } from './cron/pick-rec.ts'
import { startPromptDiscussionJob } from './cron/prompt-discussion.ts'
import { connectDb } from './db/db.js'
import { initDiscordClient } from './discord/discord-client.js'

const init = () => {
    configDotenv()
    connectDb()
    initDiscordClient()
    startPickRecJob()
    startPromptDiscussionJob()
}

init()
