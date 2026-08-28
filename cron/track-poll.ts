import type { SendableChannels } from 'discord.js'
import { getConfig } from '../config/config.ts'
import { saveTrackPoll } from '../db/db.ts'
import {
    MAX_ANSWER_TEXT_LENGTH,
    MAX_POLL_ANSWERS,
    MAX_QUESTION_TEXT_LENGTH,
    truncate
} from '../discord/poll-limits.ts'
import type { AlbumTrack } from '../spotify/album.ts'
import { fetchAlbum, fetchTrackPopularity } from '../spotify/album.ts'
import { selectPollTracks } from '../spotify/select-poll-tracks.ts'
import { getSpotifyClient, type SpotifyClient } from '../spotify/spotify-client.ts'
import { parseAlbumId } from '../spotify/spotify-urls.ts'

// A one-answer poll isn't a vote.
const MIN_POLL_ANSWERS = 2

const HOUR_MS = 3_600_000

/**
 * Posts a poll on the best track of the given rec. Does nothing unless the rec
 * is a Spotify album link and Spotify credentials are configured, so a club that
 * recommends anything else keeps working as before.
 */
export const postTrackPoll = async (
    guildId: string,
    channel: SendableChannels,
    rec: string
): Promise<void> => {
    const albumId = parseAlbumId(rec)
    if (!albumId) {
        return
    }

    const spotify = getSpotifyClient()
    if (!spotify.canRead()) {
        console.log(`Skipping track poll for guild ${guildId}: Spotify credentials are not configured`)
        return
    }

    const album = await fetchAlbum(spotify, albumId)
    const tracks = await selectBallot(spotify, album.tracks)
    if (tracks.length < MIN_POLL_ANSWERS) {
        console.log(`Skipping track poll for album ${album.name} in guild ${guildId}: only ${tracks.length} track(s)`)
        return
    }

    const durationHours = getConfig().pollDurationHours
    const message = await channel.send({
        content: `## Which track was the best?\nVoting on **${album.name}** closes in ${durationHours} hours.`,
        poll: {
            question: { text: truncate(`Best track on ${album.name}?`, MAX_QUESTION_TEXT_LENGTH) },
            answers: tracks.map(track => ({ text: truncate(track.name, MAX_ANSWER_TEXT_LENGTH) })),
            duration: durationHours,
            allowMultiselect: false
        }
    })

    // Discord assigns the answer ids, so read them back rather than assuming
    // where they start.
    const answerIds = message.poll ? [...message.poll.answers.keys()] : []
    await saveTrackPoll({
        guildId: guildId,
        channelId: message.channelId,
        messageId: message.id,
        albumName: album.name,
        albumUrl: album.url,
        createdAt: message.createdTimestamp,
        expiresAt: message.poll?.expiresTimestamp ?? message.createdTimestamp + durationHours * HOUR_MS,
        answers: tracks.map((track, index) => ({
            answerId: answerIds[index] ?? index + 1,
            trackName: track.name,
            trackUri: track.uri
        })),
        resolved: false
    })
}

/**
 * Popularity is only worth fetching when the album is too long to fit on the
 * ballot whole.
 */
const selectBallot = async (spotify: SpotifyClient, tracks: AlbumTrack[]): Promise<AlbumTrack[]> => {
    if (tracks.length <= MAX_POLL_ANSWERS) {
        return selectPollTracks(tracks, new Map(), MAX_POLL_ANSWERS)
    }

    const popularity = await fetchTrackPopularity(spotify, tracks.map(track => track.id))
    return selectPollTracks(tracks, popularity, MAX_POLL_ANSWERS)
}
