import { CronJob } from 'cron'
import { getConfig } from '../config/config.ts'
import { getChannel } from '../discord/discord-client.ts'
import { getAllGuildIds, getOrCreateGuild, getMostRecentPickedRec } from '../db/db.ts'
import { randomInt } from 'crypto'

const promptDiscussion = async (guildId: string) => {
    const preferredChannelId = (await getOrCreateGuild(guildId))?.preferredChannelId
    if (preferredChannelId === null) {
        console.error("Can't prompt discussion with no preferred channel. Run /init command")
        return
    }
    const channel = await getChannel(preferredChannelId)
    if (!channel.isSendable()) {
        console.error("Can't prompt discussion in a channel which isn't sendable. Run /init command in a better channel")
        return
    }

    const latestPickedRec = await getMostRecentPickedRec(guildId)
    if (!latestPickedRec) {
        console.error("No latest picked rec to discuss")
        return
    }

    await channel.send(messageOptions[randomInt(0, messageOptions.length)](latestPickedRec.name))
}

const promptDiscussions = async () => {
    (await getAllGuildIds()).forEach(guildId => promptDiscussion(guildId))
}

export const startPromptDiscussionJob = () => {
    const cron = getConfig().promptDiscussionCron
    CronJob.from({
        cronTime: cron,
        onTick: promptDiscussions,
        start: true,
        timeZone: 'America/New_York'
    })
    console.log(`started promptdiscussion job with cronTime ${cron}`)
}

const messageOptions: ((recName: string) => string)[] = [
    (recName: string) => `Did you like ${recName}?`,
    (recName: string) => `What was your favorite track on ${recName}?`,
    (recName: string) => `What was your least favorite track on ${recName}?`,
    (recName: string) => `What's one thing that ${recName} did well?`,
    (recName: string) => `What's one thing that ${recName} did not do well?`,
    (recName: string) => `What would you rate ${recName} out of 10?`,
    (recName: string) => `What were you doing while listening to ${recName}? Did it suit that activity well?`,
    (recName: string) => `What did ${recName} make you think of?`,
    (recName: string) => `What emotion did you feel while listening to ${recName}?`,
    (recName: string) => `Did you add ${recName} to your own library?`,
    (recName: string) => `What's worth saying about ${recName}?`,
]
