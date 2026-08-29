import { CronJob } from 'cron'
import type { Message, Poll } from 'discord.js'
import { getConfig } from '../../config/config.ts'
import { getUnresolvedTrackPolls, resolveTrackPoll } from '../../db/db.ts'
import { fetchMessage } from '../../discord/discord-client.ts'
import type { TrackPoll } from '../../models/track-poll.ts'
import { playlistUrl } from '../../spotify/spotify-urls.ts'
import { pickWinningAnswer, type TalliedAnswer } from '../../util/pick-poll-winner.ts'
import { addWinningTrackToPlaylist } from './add-winning-track.ts'

const TIME_ZONE = 'America/New_York'

// Discord finalizes a poll's results shortly after it expires. Give it a while,
// then tally the counts we have rather than retrying forever.
const FINALIZE_GRACE_MS = 3_600_000

// The channel or the message is gone, so there's nothing left to tally.
const GONE_ERROR_CODES = [10003, 10004, 10008]

const isGone = (error: unknown): boolean =>
    GONE_ERROR_CODES.includes((error as { code?: number })?.code as number)

const tallyTrackPoll = async (trackPoll: TrackPoll) => {
    const now = Date.now()
    if (now < trackPoll.expiresAt) {
        return
    }

    let message
    try {
        message = await fetchMessage(trackPoll.channelId, trackPoll.messageId)
    } catch (e) {
        if (!isGone(e)) {
            throw e
        }
        console.warn(`Track poll message ${trackPoll.messageId} in guild ${trackPoll.guildId} is gone, dropping it`)
        await resolveTrackPoll(trackPoll.messageId, {})
        return
    }

    if (!message?.poll) {
        console.warn(`Message ${trackPoll.messageId} in guild ${trackPoll.guildId} no longer carries a poll, dropping it`)
        await resolveTrackPoll(trackPoll.messageId, {})
        return
    }

    // Discord rounds a poll's duration up to a whole hour, so one configured to
    // run for less than that is still open when it comes due. End it ourselves.
    let poll: Poll = message.poll
    if (!poll.resultsFinalized && poll.expiresTimestamp > now) {
        poll = (await poll.end()).poll ?? poll
    }

    if (!poll.resultsFinalized && now < trackPoll.expiresAt + FINALIZE_GRACE_MS) {
        return
    }

    const tallied: TalliedAnswer[] = trackPoll.answers.map(answer => ({
        ...answer,
        voteCount: poll.answers.get(answer.answerId)?.voteCount ?? 0
    }))
    const winner = pickWinningAnswer(tallied)

    if (!winner) {
        await announce(message, `## Nobody voted on **${trackPoll.albumName}**.\nNo track for the playlist this week.`)
        await resolveTrackPoll(trackPoll.messageId, {})
        return
    }

    const playlistId = await addWinningTrackToPlaylist(trackPoll.guildId, winner.trackName, winner.trackUri)
    await announce(
        message,
        `## The best track on ${trackPoll.albumName} is...\n` +
        `### ${winner.trackName}!\n` +
        (playlistId
            ? `Added to <${playlistUrl(playlistId)}>`
            : "I couldn't add it to the club playlist.")
    )
    await resolveTrackPoll(trackPoll.messageId, {
        winnerTrackName: winner.trackName,
        winnerTrackUri: winner.trackUri,
        addedToPlaylist: playlistId !== null
    })
}

const announce = async (pollMessage: Message, content: string) => {
    if (!pollMessage.channel.isSendable()) {
        console.error(`Channel ${pollMessage.channelId} is no longer sendable, skipping the poll result`)
        return
    }
    await pollMessage.channel.send(content)
}

const tallyTrackPolls = async () => {
    try {
        const trackPolls = await getUnresolvedTrackPolls()
        const results = await Promise.allSettled(trackPolls.map(trackPoll => tallyTrackPoll(trackPoll)))
        results.forEach((result, i) => {
            if (result.status === 'rejected') {
                console.error(`Failed to tally track poll ${trackPolls[i].messageId}: ${result.reason}`)
            }
        })
    } catch (e) {
        console.error(`Failed to tally track polls: ${e}`)
    }
}

export const startTallyTrackPollJob = () => {
    const cron = getConfig().tallyTrackPollCron
    CronJob.from({
        cronTime: cron,
        onTick: tallyTrackPolls,
        start: true,
        timeZone: TIME_ZONE
    })
    console.log(`started tallytrackpoll job with cronTime ${cron}`)
}
