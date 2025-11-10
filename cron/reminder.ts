import { getConfig } from '../config/config.ts';
import { CronJob } from 'cron';
import { DateTime } from 'luxon';
import { getAllGuildIds, getMostRecentPickedRec } from '../db/db.ts';
import { getPreferredChannel } from '../util/get-preferred-channel.ts';

const sendReminder = async (guildId: string) => {
    const channel = await getPreferredChannel(guildId)

    const latestPickedRec = await getMostRecentPickedRec(guildId)
    if (!latestPickedRec) {
        console.error("No latest picked rec to discuss")
        return
    }

    const dueByDays = CronJob.from({
        cronTime: getConfig().promptDiscussionCron,
        onTick: () => {},
        start: false,
        timeZone: 'America/New_York'
    }).nextDate().diff(DateTime.now()).days
    await channel.send(
        `## Don't forget!\nThis week's recommendation, ${latestPickedRec.name}, is due in ${dueByDays} days. Give it a listen!`
    )
}

const sendReminders = async () => {
    try {
        (await getAllGuildIds()).forEach(guildId => sendReminder(guildId))
    } catch (e) {
        console.error(`Failed to prompt discussions: ${e}`)
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
    console.log(`started reminder job with cronTime ${cron}`)
}
