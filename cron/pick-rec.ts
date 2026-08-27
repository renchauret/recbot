import { randomInt } from 'node:crypto'
import { CronJob } from 'cron'
import { getConfig } from '../config/config.ts'
import { getAllGuildIds, getProfiles, savePickRec, updatePity } from '../db/db.ts'
import { getPreferredChannel } from '../util/get-preferred-channel.ts'
import type { Profile } from '../models/profile.ts'

const pickRec = async (guildId: string) => {
    const channel = await getPreferredChannel(guildId)

    const profiles = (await getProfiles(guildId)).filter(profile => profile.recs.length > 0 && !profile.disabled)
    if (!profiles || profiles.length === 0) {
        console.error(`No recs to choose from for guild ${guildId}`)
        return
    }

    const pickedProfile = pickWinningProfile(profiles);

    const pickedRec = await savePickRec(guildId, pickedProfile)

    await updatePity(profiles, pickedProfile);

    await channel.send(`## This week's recommendation is...\n### ${pickedRec.name} from <@${pickedProfile.id}>!\nGive it a listen by next Friday.`)
}

const pickRecs = async () => {
    try {
        const guildIds = await getAllGuildIds()
        const results = await Promise.allSettled(guildIds.map(guildId => pickRec(guildId)))
        results.forEach((result, i) => {
            if (result.status === 'rejected') {
                console.error(`Failed to pick rec for guild ${guildIds[i]}: ${result.reason}`)
            }
        })
    } catch (e) {
        console.error(`Failed to pick recs: ${e}`)
    }
}

const pickWinningProfile = (eligibleProfiles: Profile[]): Profile | undefined => {
    if (eligibleProfiles.length === 0) {
        return undefined;
    }

    let totalPity = 0;
    const boundaries = [];
    eligibleProfiles.forEach(profile => {
        const pity = Math.floor(1.5 ** (profile.weeksSinceLastPicked ?? 0));
        totalPity += pity;
        boundaries.push(boundaries.length === 0 ? pity : boundaries[boundaries.length - 1] + pity);
    });

    const randomNumber = randomInt(0, totalPity);
    for (let i = 0; i < eligibleProfiles.length; i++) {
        const currentBoundary = boundaries[i];
        if (randomNumber < currentBoundary) {
            return eligibleProfiles[i];
        }
    }

    return eligibleProfiles[0];
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
