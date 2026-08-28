// Spotify ids are 22 base62 characters.
const ID = '[A-Za-z0-9]{22}'

const linkPatterns = (kind: string): RegExp[] => [
    // open.spotify.com/album/<id>, including the /intl-xx/ localized form
    new RegExp(`open\\.spotify\\.com/(?:intl-[A-Za-z-]+/)?${kind}/(${ID})`),
    new RegExp(`spotify:${kind}:(${ID})`)
]

const firstMatch = (value: string, patterns: RegExp[]): string | null => {
    for (const pattern of patterns) {
        const match = pattern.exec(value)
        if (match) {
            return match[1]
        }
    }
    return null
}

/**
 * The album id in a rec, or null if the rec isn't a Spotify album link. Recs are
 * free text, so anything unrecognized has to fall through rather than throw.
 */
export const parseAlbumId = (rec: string): string | null =>
    rec ? firstMatch(rec.trim(), linkPatterns('album')) : null

/**
 * Accepts a bare id as well as a link, since this one is typed deliberately by a
 * user answering a slash command rather than scraped out of free text.
 */
export const parsePlaylistId = (input: string): string | null => {
    if (!input) {
        return null
    }
    const trimmed = input.trim()
    return new RegExp(`^${ID}$`).test(trimmed)
        ? trimmed
        : firstMatch(trimmed, linkPatterns('playlist'))
}
