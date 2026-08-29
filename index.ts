import { configDotenv } from 'dotenv'
import { runPickRecCatchUp, startPickRecJob } from './cron/pick-rec.ts'
import { startPromptDiscussionJob } from './cron/prompt-discussion.ts'
import { initDiscordClient, onClientReady } from './discord/discord-client.ts'
import { startReminderJob } from './cron/reminder.ts'
import { startTallyTrackPollJob } from './cron/track-poll/tally-track-poll.ts'

// A rejected promise nobody handled would otherwise terminate the process on
// Node 22. Most of these are transient (Discord or Atlas briefly unreachable),
// so log and keep running: the client reconnects on its own and the next cron
// tick gets another shot.
const installProcessHandlers = () => {
    process.on('unhandledRejection', reason => {
        console.error(`Unhandled promise rejection: ${reason instanceof Error ? reason.stack : reason}`)
    })

    // An uncaught exception leaves the process in an undefined state, so exit
    // and let the supervisor restart us cleanly rather than limping along.
    process.on('uncaughtException', error => {
        console.error(`Uncaught exception, exiting: ${error.stack ?? error}`)
        process.exit(1)
    })
}

const init = () => {
    installProcessHandlers()
    configDotenv()
    // Registered before login so the callback can't be missed.
    onClientReady(runPickRecCatchUp)
    initDiscordClient()
    startPickRecJob()
    startPromptDiscussionJob()
    startReminderJob()
    startTallyTrackPollJob()
}

init()
