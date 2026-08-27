import { randomInt } from 'node:crypto'
import { CronJob } from 'cron'
import { getConfig } from '../config/config.ts'
import { getAllGuildIds, getMostRecentPickedRec, getProfiles, savePickRec, updatePity } from '../db/db.ts'
import { getPreferredChannel } from '../util/get-preferred-channel.ts'
import { getPreviousOccurrence } from '../util/previous-occurrence.ts'
import type { Profile } from '../models/profile.ts'

const TIME_ZONE = 'America/New_York'

const pickRec = async (guildId: string) => {
    const channel = await getPreferredChannel(guildId)
    if (!channel) {
        return
    }

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

/**
 * Runs the pick a guild missed while the bot was down. Only the most recent
 * scheduled pick is considered, so a longer outage still produces exactly one
 * catch-up rather than a burst of backdated picks.
 */
const catchUpMissedPick = async (guildId: string, dueAt: Date) => {
    const latestPickedRec = await getMostRecentPickedRec(guildId)
    if (!latestPickedRec) {
        // Nothing has ever been picked here, so there is no missed run to make
        // up -- a guild that just ran /recinit waits for its first scheduled
        // pick like normal.
        return
    }

    if (latestPickedRec.pickedDate >= dueAt.getTime()) {
        return
    }

    console.log(
        `Guild ${guildId} missed the pick due at ${dueAt.toISOString()} ` +
        `(last pick was ${new Date(latestPickedRec.pickedDate).toISOString()}), picking now`
    )
    await pickRec(guildId)
}

const catchUpMissedPicks = async () => {
    try {
        const dueAt = getPreviousOccurrence(getConfig().pickRecCron, TIME_ZONE)
        if (!dueAt) {
            return
        }

        const guildIds = await getAllGuildIds()
        const results = await Promise.allSettled(guildIds.map(guildId => catchUpMissedPick(guildId, dueAt)))
        results.forEach((result, i) => {
            if (result.status === 'rejected') {
                console.error(`Failed to catch up missed pick for guild ${guildIds[i]}: ${result.reason}`)
            }
        })
    } catch (e) {
        console.error(`Failed to catch up missed picks: ${e}`)
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
        timeZone: TIME_ZONE
    })
    console.log(`started pickrec job with cronTime ${cron}`)
}

/**
 * Makes up a pick missed while the bot was down. Must run once the Discord
 * client is ready, since it needs to fetch the channel to post in.
 */
export const runPickRecCatchUp = () => catchUpMissedPicks()
