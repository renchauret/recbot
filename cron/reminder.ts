import { getConfig } from '../config/config.ts'
import { CronJob } from 'cron'
import { DateTime } from 'luxon'
import { getAllGuildIds, getMostRecentPickedRec } from '../db/db.ts'
import { getPreferredChannel } from '../util/get-preferred-channel.ts'
import { logger } from '../util/logger.ts'

const sendReminder = async (guildId: string) => {
    const channel = await getPreferredChannel(guildId)
    if (!channel) {
        return
    }

    const latestPickedRec = await getMostRecentPickedRec(guildId)
    if (!latestPickedRec) {
        logger.error(`No latest picked rec to remind for guild ${guildId}`)
        return
    }

    // No point chasing anyone about an album the club has already discussed.
    if (latestPickedRec.discussed) {
        logger.log(`Already discussed ${latestPickedRec.name} in guild ${guildId}, skipping the reminder`)
        return
    }

    const mockPromptDiscussionCronJob = CronJob.from({
        cronTime: getConfig().promptDiscussionCron,
        onTick: () => {},
        start: false,
        timeZone: 'America/New_York'
    })
    const dueByDays = Math.ceil(
        mockPromptDiscussionCronJob.nextDate().diff(DateTime.now()).milliseconds / 86400000 // 86400000 = ms per day
    )
    await channel.send(
        `## Don't forget!\nThis week's recommendation, ${latestPickedRec.name}, is due in ${dueByDays} days. Give it a listen!`
    )
    await mockPromptDiscussionCronJob.stop()
}

const sendReminders = async () => {
    try {
        const guildIds = await getAllGuildIds()
        const results = await Promise.allSettled(guildIds.map(guildId => sendReminder(guildId)))
        results.forEach((result, i) => {
            if (result.status === 'rejected') {
                logger.error(`Failed to remind guild ${guildIds[i]}: ${result.reason}`)
            }
        })
    } catch (e) {
        logger.error(`Failed to remind: ${e}`)
    }
}

export const startReminderJob = () => {
    const cron = getConfig().reminderCron
    CronJob.from({
        cronTime: cron,
        onTick: sendReminders,
        start: true,
        timeZone: 'America/New_York'
    })
    logger.log(`started reminder job with cronTime ${cron}`)
}
