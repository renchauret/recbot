import {
    getAllGuildIds,
    getMostRecentPickedRec,
    getPreferredChannelId,
} from '../db/utils.ts'
import { client } from '../index.ts'
import { CronJob } from 'cron'

const promptDiscussion = async (guildId: string) => {
    const preferredChannelId = getPreferredChannelId(guildId)
    if (preferredChannelId === null) {
        console.error("Can't prompt discussion with no preferred channel. Run /init command")
        return
    }
    const channel = await client.channels.fetch(preferredChannelId)
    if (!channel.isSendable()) {
        console.error("Can't prompt discussion in a channel which isn't sendable. Run /init command in a better channel")
        return
    }

    const latestPickedRec = getMostRecentPickedRec(guildId)

    // todo random message
    await channel.send(`How was ${latestPickedRec.name}?`)
}

const promptDiscussions = () => {
    getAllGuildIds().forEach(guildId => promptDiscussion(guildId))
}

export const startPromptDiscussionJob = () => {
    CronJob.from({
        cronTime: '30 * * * * *',
        onTick: promptDiscussions,
        start: true,
        timeZone: 'America/New_York'
    })
    console.log('started pickrec job')
}
