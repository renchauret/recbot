import { randomInt } from 'node:crypto'
import { CronJob } from 'cron'
import { getConfig } from '../config/config.ts'
import { getAllGuildIds, getProfiles, savePickRec } from '../db/db.ts'
import { getPreferredChannel } from '../util/get-preferred-channel.ts'

const pickRec = async (guildId: string) => {
    const channel = await getPreferredChannel(guildId)

    const profiles = (await getProfiles(guildId)).filter(profile => profile.recs.length > 0)
    if (!profiles || profiles.length === 0) {
        console.error('No recs to choose from for guild ${guildId}')
        return
    }
    const pickedProfile = profiles[randomInt(0, profiles.length)]
    const pickedRec = await savePickRec(guildId, pickedProfile)

    await channel.send(`## This week's recommendation is...\n### ${pickedRec.name} from <@${pickedProfile.id}>!\nGive it a listen by next Friday.`)
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
