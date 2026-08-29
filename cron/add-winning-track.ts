import { getOrCreateGuild } from '../db/db.ts'
import { addTrackToPlaylist } from '../spotify/playlist.ts'
import { getSpotifyClient } from '../spotify/spotify-client.ts'

/**
 * Adds a winning track to the guild's playlist, reporting whether it landed. A
 * Spotify failure can't be allowed to hold up announcing the result, so this
 * logs rather than throws.
 */
export const addWinningTrackToPlaylist = async (
    guildId: string,
    trackName: string,
    trackUri: string
): Promise<boolean> => {
    const playlistId = (await getOrCreateGuild(guildId))?.playlistId
    if (!playlistId) {
        console.error(`Can't add ${trackName} to a playlist: guild ${guildId} has none set`)
        return false
    }

    const spotify = getSpotifyClient()
    if (!spotify.canWritePlaylists()) {
        console.error(`Can't add ${trackName} to playlist ${playlistId}: Spotify playlist access is not configured`)
        return false
    }

    try {
        await addTrackToPlaylist(spotify, playlistId, trackUri)
        return true
    } catch (e) {
        console.error(`Failed to add ${trackUri} to playlist ${playlistId} for guild ${guildId}: ${e}`)
        return false
    }
}
