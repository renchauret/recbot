import { randomInt } from 'node:crypto'
import { CronJob } from 'cron'
import { getConfig } from '../config/config.ts'
import { getChannel } from '../discord/discord-client.ts'
import { getAllGuildIds, getOrCreateGuild, getProfiles, savePickRec } from '../db/db.ts'

const pickRec = async (guildId: string) => {
    const preferredChannelId = (await getOrCreateGuild(guildId))?.preferredChannelId
    if (preferredChannelId === null) {
        console.error("Can't pick a rec with no preferred channel. Run /init command")
        return
    }
    const channel = await getChannel(preferredChannelId)
    if (!channel.isSendable()) {
        console.error("Can't pick a rec in a channel which isn't sendable. Run /init command in a better channel")
        return
    }

    const profiles = (await getProfiles(guildId)).filter(profile => profile.recs.length > 0)
    if (!profiles || profiles.length === 0) {
        console.error('No recs to choose from')
        return
    }
    const pickedProfile = profiles[randomInt(0, profiles.length)]
    const pickedRec = await savePickRec(guildId, pickedProfile)

    await channel.send(`This week's recommendation is ${pickedRec.name} from ${pickedProfile.displayName}!`)
}

const pickRecs = async () => {
    try {
        (await getAllGuildIds()).forEach(guildId => pickRec(guildId))
    } catch (e) {
        console.error(`Failed to pick recs: ${e}`)
    }
}

export const startPickRecJob = () => {
    const cron = getConfig().pickRecCron
    CronJob.from({
        cronTime: cron,
        onTick: pickRecs,
        start: true,
        timeZone: 'America/New_York'
    })
    console.log(`started pickrec job with cronTime ${cron}`)
}
