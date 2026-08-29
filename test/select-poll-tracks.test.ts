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
    assert.deepEqual(names(selectPollTracks(tracks, 10)), ['Track 1-1', 'Track 1-2', 'Track 1-3'])
})

test('orders a multi-disc album by disc then track number', () => {
    const tracks = [track(1, 2), track(2, 1), track(1, 1)]
    assert.deepEqual(names(selectPollTracks(tracks, 10)), ['Track 1-1', 'Track 1-2', 'Track 2-1'])
})

test('cuts a long album off at the ballot limit', () => {
    const tracks = Array.from({ length: 12 }, (_, index) => track(index + 1))

    const selected = selectPollTracks(tracks, 10)

    assert.equal(selected.length, 10)
    assert.deepEqual(names(selected), Array.from({ length: 10 }, (_, i) => `Track 1-${i + 1}`))
})

test('cuts a multi-disc album off in album order, not track number order', () => {
    const tracks = [track(1, 1), track(2, 1), track(1, 2)]

    assert.deepEqual(names(selectPollTracks(tracks, 2)), ['Track 1-1', 'Track 1-2'])
})

test('does not mutate the tracks it is given', () => {
    const tracks = [track(2), track(1)]
    selectPollTracks(tracks, 10)
    assert.deepEqual(names(tracks), ['Track 1-2', 'Track 1-1'])
})
