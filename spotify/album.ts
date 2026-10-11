import type { SpotifyClient } from './spotify-client.ts'

export type AlbumTrack = {
    id: string,
    name: string,
    uri: string,
    discNumber: number,
    trackNumber: number
}

export type Album = {
    id: string,
    name: string,
    url: string,
    tracks: AlbumTrack[]
}

// Spotify's maximum page size for both of the endpoints used here.
const PAGE_SIZE = 50

type ApiTrack = {
    id: string,
    name: string,
    uri: string,
    disc_number: number,
    track_number: number
}

type ApiAlbum = {
    id: string,
    name: string,
    external_urls?: { spotify?: string },
    tracks: { items: ApiTrack[], total: number }
}

const toAlbumTrack = (track: ApiTrack): AlbumTrack => ({
    id: track.id,
    name: track.name,
    uri: track.uri,
    discNumber: track.disc_number,
    trackNumber: track.track_number
})

export const fetchAlbum = async (client: SpotifyClient, albumId: string): Promise<Album> => {
    const album = await client.request<ApiAlbum>(`/albums/${albumId}?limit=${PAGE_SIZE}`)
    const tracks = album.tracks.items.map(toAlbumTrack)

    // The album object only carries the first page, so long albums need the
    // rest fetched separately.
    while (tracks.length < album.tracks.total) {
        const page = await client.request<{ items: ApiTrack[] }>(
            `/albums/${albumId}/tracks?limit=${PAGE_SIZE}&offset=${tracks.length}`
        )
        if (page.items.length === 0) {
            break
        }
        tracks.push(...page.items.map(toAlbumTrack))
    }

    return {
        id: album.id,
        name: album.name,
        url: album.external_urls?.spotify ?? `https://open.spotify.com/album/${albumId}`,
        tracks
    }
}
