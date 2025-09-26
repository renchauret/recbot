import { getAllGuildIds, getAllProfiles, getPreferredChannelId, savePicRec, saveProfile } from '../db/utils.ts'
import { randomInt } from 'node:crypto'
import { CronJob } from 'cron'
import { getConfig } from '../config/config.ts'
import { getChannel } from '../discord/discord-client.ts'

const pickRec = async (guildId: string) => {
    const preferredChannelId = getPreferredChannelId(guildId)
    if (preferredChannelId === null) {
        console.error("Can't pick a rec with no preferred channel. Run /init command")
        return
    }
    const channel = await getChannel(preferredChannelId)
    if (!channel.isSendable()) {
        console.error("Can't pick a rec in a channel which isn't sendable. Run /init command in a better channel")
        return
    }

    const profiles = getAllProfiles(guildId).filter(profile => profile.recs.length > 0)
    if (!profiles) {
        console.error('No recs to choose from')
        return
    }
    const pickedProfile = profiles[randomInt(0, profiles.length)]
    const pickedRec = savePicRec(guildId, pickedProfile)

    await channel.send(`Our new recommendation is ${pickedRec.name} from ${pickedProfile.displayName}!`)
}

const pickRecs = () => {
    getAllGuildIds().forEach(guildId => pickRec(guildId))
}

export const startPickRecJob = () => {
    CronJob.from({
        cronTime: getConfig().pickRecCron,
        onTick: pickRecs,
        start: true,
        timeZone: 'America/New_York'
    })
    console.log('started pickrec job')
}
