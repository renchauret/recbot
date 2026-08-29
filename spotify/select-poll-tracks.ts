import type { AlbumTrack } from './album.ts'

const inAlbumOrder = (a: AlbumTrack, b: AlbumTrack): number =>
    a.discNumber - b.discNumber || a.trackNumber - b.trackNumber

/**
 * The tracks to put on the ballot, in album order. Discord polls hold at most
 * ten answers, so a longer album is cut off there. Ranking the album's tracks
 * first would be better, but Spotify doesn't give this app popularity to rank
 * them by.
 */
export const selectPollTracks = (tracks: AlbumTrack[], maxAnswers: number): AlbumTrack[] =>
    [...tracks].sort(inAlbumOrder).slice(0, maxAnswers)
