import { configDotenv } from 'dotenv'
import { startPickRecJob } from './cron/pick-rec.ts'
import { startPromptDiscussionJob } from './cron/prompt-discussion.ts'
import { initDiscordClient } from './discord/discord-client.ts'
import { startReminderJob } from './cron/reminder.ts';

const init = () => {
    configDotenv()
    initDiscordClient()
    startPickRecJob()
    startPromptDiscussionJob()
    startReminderJob()
}

init()
