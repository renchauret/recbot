import { CronJob } from 'cron'
import type { Message, Poll } from 'discord.js'
import { getConfig } from '../config/config.ts'
import { getOrCreateGuild, getUnresolvedTrackPolls, resolveTrackPoll } from '../db/db.ts'
import { fetchMessage } from '../discord/discord-client.ts'
import type { TrackPoll } from '../models/track-poll.ts'
import { addTrackToPlaylist } from '../spotify/playlist.ts'
import { getSpotifyClient } from '../spotify/spotify-client.ts'
import { pickWinningAnswer, type TalliedAnswer } from '../util/pick-poll-winner.ts'

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
    const endEarlyAfterMs = getConfig().endPollsEarlyAfterMs
    const dueForEarlyEnd = endEarlyAfterMs !== null && now >= trackPoll.createdAt + endEarlyAfterMs
    if (now < trackPoll.expiresAt && !dueForEarlyEnd) {
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

    let poll: Poll = message.poll
    if (dueForEarlyEnd && now < trackPoll.expiresAt && !poll.resultsFinalized) {
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

    const addedToPlaylist = await addWinnerToPlaylist(trackPoll, winner)
    await announce(
        message,
        `## The best track on ${trackPoll.albumName} is...\n` +
        `### ${winner.trackName}!\n` +
        `${winner.voteCount} vote${winner.voteCount === 1 ? '' : 's'}. ` +
        (addedToPlaylist
            ? 'Added to the club playlist.'
            : 'Set a playlist with **/recplaylist** to collect the winners.')
    )
    await resolveTrackPoll(trackPoll.messageId, {
        winnerTrackName: winner.trackName,
        winnerTrackUri: winner.trackUri,
        addedToPlaylist: addedToPlaylist
    })
}

/**
 * Adds the winner to the guild's playlist, reporting whether it landed. A
 * Spotify failure can't be allowed to hold up announcing the result.
 */
const addWinnerToPlaylist = async (trackPoll: TrackPoll, winner: TalliedAnswer): Promise<boolean> => {
    const playlistId = (await getOrCreateGuild(trackPoll.guildId))?.playlistId
    if (!playlistId) {
        return false
    }

    const spotify = getSpotifyClient()
    if (!spotify.canWritePlaylists()) {
        console.log(`Can't add ${winner.trackName} to playlist ${playlistId}: Spotify playlist access is not configured`)
        return false
    }

    try {
        await addTrackToPlaylist(spotify, playlistId, winner.trackUri)
        return true
    } catch (e) {
        console.error(`Failed to add ${winner.trackUri} to playlist ${playlistId} for guild ${trackPoll.guildId}: ${e}`)
        return false
    }
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
