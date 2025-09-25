import { getAllGuildIds, getAllProfiles, getPreferredChannelId, saveProfile } from '../db/utils.ts'
import { randomInt } from 'node:crypto'
import { client } from '../index.ts'
import { CronJob } from 'cron'

const pickRec = async (guildId: string) => {
    const preferredChannelId = getPreferredChannelId(guildId)
    if (preferredChannelId === null) {
        console.error("Can't pick a rec with no preferred channel. Run /init command")
        return
    }
    const channel = await client.channels.fetch(preferredChannelId)
    if (!channel.isSendable()) {
        console.error("Can't pick a rec in a channel which isn't sendable. Run /init command in a better channel")
        return
    }

    const profiles = getAllProfiles(guildId)
    const pickedProfile = profiles[randomInt(0, profiles.length)]
    const pickedRec= pickedProfile.recs.splice(0, 1)[0]
    pickedProfile.pickedRecs.push({
        name: pickedRec,
        pickedDate: Date.now()
    })
    saveProfile(guildId, pickedProfile)

    await channel.send(`Our new recommendation is ${pickedRec} from ${pickedProfile.displayName}!`)
}

const pickRecs = () => {
    getAllGuildIds().forEach(guildId => pickRec(guildId))
}

export const startPickRecJob = () => {
    CronJob.from({
        cronTime: '0 * * * * *',
        onTick: pickRecs,
        start: true,
        timeZone: 'America/New_York'
    })
}
