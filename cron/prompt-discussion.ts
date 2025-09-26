import {
    getAllGuildIds,
    getMostRecentPickedRec,
    getPreferredChannelId,
} from '../db/utils.ts'
import { CronJob } from 'cron'
import { getConfig } from '../config/config.ts'
import { getChannel } from '../discord/discord-client.js'

const promptDiscussion = async (guildId: string) => {
    const preferredChannelId = getPreferredChannelId(guildId)
    if (preferredChannelId === null) {
        console.error("Can't prompt discussion with no preferred channel. Run /init command")
        return
    }
    const channel = await getChannel(preferredChannelId)
    if (!channel.isSendable()) {
        console.error("Can't prompt discussion in a channel which isn't sendable. Run /init command in a better channel")
        return
    }

    const latestPickedRec = getMostRecentPickedRec(guildId)
    if (!latestPickedRec) {
        console.error("No latest picked rec to discuss")
        return
    }

    // todo random message
    await channel.send(`How was ${latestPickedRec.name}?`)
}

const promptDiscussions = () => {
    getAllGuildIds().forEach(guildId => promptDiscussion(guildId))
}

export const startPromptDiscussionJob = () => {
    CronJob.from({
        cronTime: getConfig().promptDiscussionCron,
        onTick: promptDiscussions,
        start: true,
        timeZone: 'America/New_York'
    })
    console.log('started promptdiscussion job')
}
