import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseAlbumId, parsePlaylistId } from '../spotify/spotify-urls.ts'

const ALBUM_ID = '3QiZaIVgSMuznmUNLPMG8t'

test('parses an album id out of a share link', () => {
    assert.equal(
        parseAlbumId(`https://open.spotify.com/album/${ALBUM_ID}?si=TqgImqljTOCDBXHEdpb5fQ`),
        ALBUM_ID
    )
})

test('parses an album id out of a localized link', () => {
    assert.equal(parseAlbumId(`https://open.spotify.com/intl-fr/album/${ALBUM_ID}`), ALBUM_ID)
})

test('parses an album id out of a uri', () => {
    assert.equal(parseAlbumId(`spotify:album:${ALBUM_ID}`), ALBUM_ID)
})

test('parses an album id out of a rec with surrounding text', () => {
    assert.equal(
        parseAlbumId(`listen to this https://open.spotify.com/album/${ALBUM_ID} it rules`),
        ALBUM_ID
    )
})

test('returns null for recs that are not album links', () => {
    assert.equal(parseAlbumId('sdfhg'), null)
    assert.equal(parseAlbumId('Kid A by Radiohead'), null)
    assert.equal(parseAlbumId(''), null)
    // A bare id is too easy to confuse with an album typed out by name.
    assert.equal(parseAlbumId(ALBUM_ID), null)
})

test('returns null for other kinds of spotify links', () => {
    assert.equal(parseAlbumId(`https://open.spotify.com/track/${ALBUM_ID}`), null)
    assert.equal(parseAlbumId(`https://open.spotify.com/playlist/${ALBUM_ID}`), null)
})

test('parses a playlist id from a link, a uri, or a bare id', () => {
    assert.equal(parsePlaylistId(`https://open.spotify.com/playlist/${ALBUM_ID}?si=abc`), ALBUM_ID)
    assert.equal(parsePlaylistId(`spotify:playlist:${ALBUM_ID}`), ALBUM_ID)
    assert.equal(parsePlaylistId(`  ${ALBUM_ID}  `), ALBUM_ID)
})

test('returns null for playlist input that is not a playlist', () => {
    assert.equal(parsePlaylistId(`https://open.spotify.com/album/${ALBUM_ID}`), null)
    assert.equal(parsePlaylistId('my playlist'), null)
    assert.equal(parsePlaylistId(''), null)
})
