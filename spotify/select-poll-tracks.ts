import type { AlbumTrack } from './album.ts'

const inAlbumOrder = (a: AlbumTrack, b: AlbumTrack): number =>
    a.discNumber - b.discNumber || a.trackNumber - b.trackNumber

/**
 * The tracks to put on the ballot, in album order. Discord polls hold at most
 * ten answers, so a longer album is trimmed to its most popular tracks rather
 * than its first ten, which would leave the back half of the album unvotable.
 */
export const selectPollTracks = (
    tracks: AlbumTrack[],
    popularityByTrackId: Map<string, number>,
    maxAnswers: number
): AlbumTrack[] => {
    const ordered = [...tracks].sort(inAlbumOrder)
    if (ordered.length <= maxAnswers) {
        return ordered
    }

    const popularity = (track: AlbumTrack) => popularityByTrackId.get(track.id) ?? 0
    return [...ordered]
        .sort((a, b) => popularity(b) - popularity(a) || inAlbumOrder(a, b))
        .slice(0, maxAnswers)
        .sort(inAlbumOrder)
}
