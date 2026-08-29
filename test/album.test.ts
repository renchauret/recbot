import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fetchAlbum, fetchTrackPopularity } from '../spotify/album.ts'
import { SpotifyError, type SpotifyClient } from '../spotify/spotify-client.ts'

const apiTrack = (index: number) => ({
    id: `id${index}`,
    name: `Track ${index}`,
    uri: `spotify:track:id${index}`,
    disc_number: 1,
    track_number: index,
    popularity: index
})

/**
 * A client that answers from a canned map of paths, recording what was asked
 * for.
 */
const stubClient = (responses: Record<string, unknown>) => {
    const requested: string[] = []
    const client: SpotifyClient = {
        canRead: () => true,
        canWritePlaylists: () => true,
        request: async <T>(path: string) => {
            requested.push(path)
            if (!(path in responses)) {
                throw new Error(`Unexpected request to ${path}`)
            }
            return responses[path] as T
        }
    }
    return { requested, client }
}

test('maps an album and its tracks', async () => {
    const { client } = stubClient({
        '/albums/abc?limit=50': {
            id: 'abc',
            name: 'Kid A',
            external_urls: { spotify: 'https://open.spotify.com/album/abc' },
            tracks: { items: [apiTrack(1), apiTrack(2)], total: 2 }
        }
    })

    const album = await fetchAlbum(client, 'abc')

    assert.equal(album.name, 'Kid A')
    assert.equal(album.url, 'https://open.spotify.com/album/abc')
    assert.deepEqual(album.tracks[0], {
        id: 'id1',
        name: 'Track 1',
        uri: 'spotify:track:id1',
        discNumber: 1,
        trackNumber: 1
    })
})

test('falls back to a built url when the album has no share link', async () => {
    const { client } = stubClient({
        '/albums/abc?limit=50': { id: 'abc', name: 'Kid A', tracks: { items: [], total: 0 } }
    })

    assert.equal((await fetchAlbum(client, 'abc')).url, 'https://open.spotify.com/album/abc')
})

test('pages through an album longer than one request', async () => {
    const firstPage = Array.from({ length: 50 }, (_, index) => apiTrack(index + 1))
    const { requested, client } = stubClient({
        '/albums/abc?limit=50': { id: 'abc', name: 'Long One', tracks: { items: firstPage, total: 52 } },
        '/albums/abc/tracks?limit=50&offset=50': { items: [apiTrack(51), apiTrack(52)] }
    })

    const album = await fetchAlbum(client, 'abc')

    assert.equal(album.tracks.length, 52)
    assert.equal(album.tracks[51].name, 'Track 52')
    assert.deepEqual(requested, ['/albums/abc?limit=50', '/albums/abc/tracks?limit=50&offset=50'])
})

test('stops paging when a page comes back empty', async () => {
    const { client } = stubClient({
        '/albums/abc?limit=50': { id: 'abc', name: 'Wrong Total', tracks: { items: [apiTrack(1)], total: 99 } },
        '/albums/abc/tracks?limit=50&offset=1': { items: [] }
    })

    assert.equal((await fetchAlbum(client, 'abc')).tracks.length, 1)
})

test('fetches popularity in batches of fifty', async () => {
    const ids = Array.from({ length: 60 }, (_, index) => `id${index + 1}`)
    const { requested, client } = stubClient({
        [`/tracks?ids=${ids.slice(0, 50).join(',')}`]: {
            tracks: ids.slice(0, 50).map((id, index) => ({ ...apiTrack(index + 1), id: id }))
        },
        [`/tracks?ids=${ids.slice(50).join(',')}`]: {
            tracks: ids.slice(50).map((id, index) => ({ ...apiTrack(index + 51), id: id }))
        }
    })

    const popularity = await fetchTrackPopularity(client, ids)

    assert.equal(requested.length, 2)
    assert.equal(popularity.size, 60)
    assert.equal(popularity.get('id60'), 60)
})

test('skips tracks spotify could not resolve', async () => {
    const { client } = stubClient({
        '/tracks?ids=id1,id2': { tracks: [apiTrack(1), null] }
    })

    const popularity = await fetchTrackPopularity(client, ['id1', 'id2'])

    assert.deepEqual([...popularity.entries()], [['id1', 1]])
})

test('defaults missing popularity to zero', async () => {
    const { client } = stubClient({
        '/tracks?ids=id1': { tracks: [{ ...apiTrack(1), popularity: undefined }] }
    })

    assert.equal((await fetchTrackPopularity(client, ['id1'])).get('id1'), 0)
})

test('falls back to no popularity when spotify refuses the batch endpoint', async () => {
    const client: SpotifyClient = {
        canRead: () => true,
        canWritePlaylists: () => true,
        request: async () => {
            throw new SpotifyError(403, 'Forbidden')
        }
    }

    assert.equal((await fetchTrackPopularity(client, ['id1', 'id2'])).size, 0)
})
