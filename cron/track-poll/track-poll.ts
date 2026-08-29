import type { SendableChannels } from 'discord.js'
import { getConfig } from '../../config/config.ts'
import { getOrCreateGuild, saveTrackPoll } from '../../db/db.ts'
import {
    MAX_ANSWER_TEXT_LENGTH,
    MAX_POLL_ANSWERS,
    MAX_QUESTION_TEXT_LENGTH,
    toPollDurationHours,
    truncate
} from '../../discord/poll-limits.ts'
import { fetchAlbum, fetchTrackPopularity } from '../../spotify/album.ts'
import { selectPollTracks } from '../../spotify/select-poll-tracks.ts'
import { getSpotifyClient } from '../../spotify/spotify-client.ts'
import { parseAlbumId } from '../../spotify/spotify-urls.ts'
import { formatDuration } from '../../util/format-duration.ts'
import { addWinningTrackToPlaylist } from './add-winning-track.ts'

// A one-answer poll isn't a vote.
const MIN_POLL_ANSWERS = 2

/**
 * Posts a poll on the best track of the given rec. Does nothing unless the rec
 * is a Spotify album link, Spotify credentials are configured, and the guild has
 * a playlist for the winner to go to, so a club that recommends anything else
 * keeps working as before.
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

    // Without somewhere to put the winner there's nothing for the vote to
    // decide, so don't ask the club to vote at all. That takes both a playlist
    // and the grant needed to write to it.
    if (!spotify.canWritePlaylists()) {
        console.log(
            `Skipping track poll for guild ${guildId}: Spotify playlist access is not configured. ` +
            'Run npm run spotify-auth'
        )
        return
    }

    if (!(await getOrCreateGuild(guildId))?.playlistId) {
        console.log(`Skipping track poll for guild ${guildId}: no playlist set. Run /recplaylist`)
        return
    }

    const album = await fetchAlbum(spotify, albumId)
    if (album.tracks.length === 0) {
        console.error(`Skipping track poll for guild ${guildId}: album ${album.name} has no tracks`)
        return
    }

    // A single is its own winner. Nothing to vote on, but it still belongs in
    // the playlist.
    if (album.tracks.length < MIN_POLL_ANSWERS) {
        await addSingleTrack(guildId, channel, album.name, album.tracks[0])
        return
    }

    const popularity = await fetchTrackPopularity(spotify, album.tracks.map(track => track.id))
    const tracks = selectPollTracks(album.tracks, popularity, MAX_POLL_ANSWERS)

    const durationMs = getConfig().pollDurationMs
    const message = await channel.send({
        content: `## Which track was the best?\nVoting on **${album.name}** closes in ${formatDuration(durationMs)}.`,
        poll: {
            question: { text: truncate(`Best track on ${album.name}?`, MAX_QUESTION_TEXT_LENGTH) },
            answers: tracks.map(track => ({ text: truncate(track.name, MAX_ANSWER_TEXT_LENGTH) })),
            duration: toPollDurationHours(durationMs),
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
        // The configured duration rather than the poll's, which Discord rounds
        // up to a whole hour. Anything shorter is ended early when it comes due.
        expiresAt: message.createdTimestamp + durationMs,
        answers: tracks.map((track, index) => ({
            answerId: answerIds[index] ?? index + 1,
            trackName: track.name,
            trackUri: track.uri,
            popularity: popularity.get(track.id) ?? 0
        })),
        resolved: false
    })
}

const addSingleTrack = async (
    guildId: string,
    channel: SendableChannels,
    albumName: string,
    track: { name: string, uri: string }
): Promise<void> => {
    const added = await addWinningTrackToPlaylist(guildId, track.name, track.uri)
    await channel.send(
        `## ${albumName} only has one track, so it wins by default.\n` +
        `### ${track.name}\n` +
        (added ? 'Added to the club playlist.' : "I couldn't add it to the club playlist.")
    )
}
