import { CronJob } from 'cron'
import { getConfig } from '../config/config.ts'
import { getAllGuildIds, getMostRecentPickedRec, markRecDiscussed } from '../db/db.ts'
import { randomInt } from 'crypto'
import { getPreferredChannel } from '../util/get-preferred-channel.ts'
import { postTrackPoll } from './track-poll/track-poll.ts'

const promptDiscussion = async (guildId: string) => {
    const channel = await getPreferredChannel(guildId)
    if (!channel) {
        return
    }

    const latestPickedRec = await getMostRecentPickedRec(guildId)
    if (!latestPickedRec) {
        console.error(`No latest picked rec to discuss for guild ${guildId}`)
        return
    }

    // Each pick is discussed once. Until the next one lands there's nothing new
    // to talk about.
    if (latestPickedRec.discussed) {
        console.log(`Already discussed ${latestPickedRec.name} in guild ${guildId}, waiting on the next pick`)
        return
    }

    // The poll goes up first so it sits above the discussion prompt. A Spotify
    // failure shouldn't cost the club its discussion.
    try {
        await postTrackPoll(guildId, channel, latestPickedRec.name)
    } catch (e) {
        console.error(`Failed to post track poll for guild ${guildId}: ${e}`)
    }

    await channel.send(`## Let's discuss!\n${messageOptions[randomInt(0, messageOptions.length)](latestPickedRec.name)}`)

    // Only after the prompt is out, so a failed send is retried on the next tick.
    await markRecDiscussed(guildId, latestPickedRec.pickedDate)
}

const promptDiscussions = async () => {
    try {
        const guildIds = await getAllGuildIds()
        const results = await Promise.allSettled(guildIds.map(guildId => promptDiscussion(guildId)))
        results.forEach((result, i) => {
            if (result.status === 'rejected') {
                console.error(`Failed to prompt discussion for guild ${guildIds[i]}: ${result.reason}`)
            }
        })
    } catch (e) {
        console.error(`Failed to prompt discussions: ${e}`)
    }
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
    (recName: string) => `Did you like ${recName} ?`,
    (recName: string) => `What was your favorite track on ${recName} ?`,
    (recName: string) => `What was your least favorite track on ${recName} ?`,
    (recName: string) => `What's one thing that ${recName} did well?`,
    (recName: string) => `What's one thing that ${recName} did not do well?`,
    (recName: string) => `What would you rate ${recName} out of 10?`,
    (recName: string) => `What were you doing while listening to ${recName}? Did it suit that activity well?`,
    (recName: string) => `What did ${recName} make you think of?`,
    (recName: string) => `What emotion did you feel while listening to ${recName} ?`,
    (recName: string) => `Did you add ${recName} to your own library?`,
    (recName: string) => `What's worth saying about ${recName} ?`,
]
