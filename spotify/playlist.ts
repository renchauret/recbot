import type { SpotifyClient } from './spotify-client.ts'

export const addTrackToPlaylist = async (
    client: SpotifyClient,
    playlistId: string,
    trackUri: string
): Promise<void> => {
    await client.request(`/playlists/${playlistId}/tracks`, {
        method: 'POST',
        body: { uris: [trackUri] },
        as: 'user'
    })
}

/**
 * The playlist's name, or null if it can't be read. Used only to confirm back to
 * whoever ran the command, so a failure here isn't worth propagating.
 */
export const fetchPlaylistName = async (
    client: SpotifyClient,
    playlistId: string
): Promise<string | null> => {
    try {
        const playlist = await client.request<{ name?: string }>(
            `/playlists/${playlistId}?fields=name`,
            { as: client.canWritePlaylists() ? 'user' : 'app' }
        )
        return playlist.name ?? null
    } catch (e) {
        console.error(`Failed to fetch name of playlist ${playlistId}: ${e}`)
        return null
    }
}
