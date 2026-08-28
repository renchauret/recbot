import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { AlbumTrack } from '../spotify/album.ts'
import { selectPollTracks } from '../spotify/select-poll-tracks.ts'

const track = (trackNumber: number, discNumber = 1): AlbumTrack => ({
    id: `id${discNumber}-${trackNumber}`,
    name: `Track ${discNumber}-${trackNumber}`,
    uri: `spotify:track:id${discNumber}-${trackNumber}`,
    discNumber: discNumber,
    trackNumber: trackNumber
})

const names = (tracks: AlbumTrack[]) => tracks.map(t => t.name)

test('keeps every track when the album fits on the ballot', () => {
    const tracks = [track(3), track(1), track(2)]
    assert.deepEqual(names(selectPollTracks(tracks, new Map(), 10)), ['Track 1-1', 'Track 1-2', 'Track 1-3'])
})

test('orders a multi-disc album by disc then track number', () => {
    const tracks = [track(1, 2), track(2, 1), track(1, 1)]
    assert.deepEqual(names(selectPollTracks(tracks, new Map(), 10)), ['Track 1-1', 'Track 1-2', 'Track 2-1'])
})

test('trims a long album to its most popular tracks, in album order', () => {
    const tracks = Array.from({ length: 12 }, (_, index) => track(index + 1))
    // Tracks 3 and 7 are the least popular, so they should be the two dropped.
    const popularity = new Map(tracks.map(t => [t.id, t.trackNumber === 3 || t.trackNumber === 7 ? 1 : 50]))

    const selected = selectPollTracks(tracks, popularity, 10)

    assert.equal(selected.length, 10)
    assert.deepEqual(
        names(selected),
        [1, 2, 4, 5, 6, 8, 9, 10, 11, 12].map(n => `Track 1-${n}`)
    )
})

test('treats unknown popularity as least popular', () => {
    const tracks = Array.from({ length: 11 }, (_, index) => track(index + 1))
    const popularity = new Map(tracks.filter(t => t.trackNumber !== 5).map(t => [t.id, 10]))

    assert.equal(names(selectPollTracks(tracks, popularity, 10)).includes('Track 1-5'), false)
})

test('breaks popularity ties by album order', () => {
    const tracks = Array.from({ length: 11 }, (_, index) => track(index + 1))

    const selected = selectPollTracks(tracks, new Map(), 10)

    assert.equal(selected.length, 10)
    assert.equal(names(selected).includes('Track 1-11'), false)
})

test('does not mutate the tracks it is given', () => {
    const tracks = [track(2), track(1)]
    selectPollTracks(tracks, new Map(), 10)
    assert.deepEqual(names(tracks), ['Track 1-2', 'Track 1-1'])
})
