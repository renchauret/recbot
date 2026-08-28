const TOKEN_URL = 'https://accounts.spotify.com/api/token'
const API_BASE = 'https://api.spotify.com/v1'

// Renew slightly early so a token can't expire in flight.
const EXPIRY_MARGIN_MS = 60_000

export type SpotifyCredentials = {
    clientId: string | undefined,
    clientSecret: string | undefined,
    refreshToken: string | undefined
}

type CachedToken = {
    accessToken: string,
    expiresAt: number
}

type TokenResponse = {
    access_token: string,
    expires_in: number
}

export type RequestOptions = {
    method?: 'GET' | 'POST',
    body?: unknown,
    // 'app' uses client credentials, which can only read public catalog data.
    // Touching a user's playlists needs the refresh token granted at install.
    as?: 'app' | 'user'
}

export type SpotifyClient = {
    canRead: () => boolean,
    canWritePlaylists: () => boolean,
    request: <T>(path: string, options?: RequestOptions) => Promise<T>
}

export class SpotifyError extends Error {
    public readonly status: number

    constructor(status: number, message: string) {
        super(message)
        this.name = 'SpotifyError'
        this.status = status
    }
}

const readBody = async (response: Response): Promise<string> => {
    try {
        return (await response.text()).slice(0, 500)
    } catch {
        return '<unreadable body>'
    }
}

/**
 * Built with its dependencies passed in so tests can drive it without network
 * access or a clock.
 */
export const createSpotifyClient = (
    credentials: () => SpotifyCredentials,
    fetchImpl: typeof fetch = fetch,
    now: () => number = Date.now
): SpotifyClient => {
    let appToken: CachedToken | null = null
    let userToken: CachedToken | null = null

    const canRead = () => {
        const { clientId, clientSecret } = credentials()
        return Boolean(clientId && clientSecret)
    }

    const canWritePlaylists = () => canRead() && Boolean(credentials().refreshToken)

    const requestToken = async (params: URLSearchParams): Promise<CachedToken> => {
        const { clientId, clientSecret } = credentials()
        const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
        const response = await fetchImpl(TOKEN_URL, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${basic}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        })

        if (!response.ok) {
            throw new SpotifyError(response.status, `Spotify token request failed: ${await readBody(response)}`)
        }

        const token = await response.json() as TokenResponse
        return {
            accessToken: token.access_token,
            expiresAt: now() + token.expires_in * 1000 - EXPIRY_MARGIN_MS
        }
    }

    const getAppToken = async (): Promise<string> => {
        if (!canRead()) {
            throw new SpotifyError(0, 'Spotify is not configured. Set spotifyClientId and spotifyClientSecret.')
        }
        if (!appToken || appToken.expiresAt <= now()) {
            appToken = await requestToken(new URLSearchParams({ grant_type: 'client_credentials' }))
        }
        return appToken.accessToken
    }

    const getUserToken = async (): Promise<string> => {
        const { refreshToken } = credentials()
        if (!canWritePlaylists()) {
            throw new SpotifyError(0, 'Spotify playlist access is not configured. Set spotifyRefreshToken.')
        }
        if (!userToken || userToken.expiresAt <= now()) {
            userToken = await requestToken(new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            }))
        }
        return userToken.accessToken
    }

    const clearToken = (as: 'app' | 'user') => {
        if (as === 'user') {
            userToken = null
        } else {
            appToken = null
        }
    }

    const send = async (path: string, options: RequestOptions, token: string): Promise<Response> =>
        await fetchImpl(`${API_BASE}${path}`, {
            method: options.method ?? 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: options.body === undefined ? undefined : JSON.stringify(options.body)
        })

    const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
        const as = options.as ?? 'app'
        const getToken = as === 'user' ? getUserToken : getAppToken

        let response = await send(path, options, await getToken())

        // A token revoked on Spotify's side still looks valid to us until it's
        // used, so drop the cached one and let the next call mint a fresh one.
        if (response.status === 401) {
            clearToken(as)
            response = await send(path, options, await getToken())
        }

        if (!response.ok) {
            throw new SpotifyError(response.status, `Spotify ${options.method ?? 'GET'} ${path} failed: ${await readBody(response)}`)
        }

        // Adding playlist items answers 201 with a body, but deletes and some
        // writes answer 204 with none.
        return response.status === 204 ? undefined as T : await response.json() as T
    }

    return { canRead, canWritePlaylists, request }
}

let client: SpotifyClient | null = null

/**
 * The shared client. Built lazily because the environment isn't loaded until
 * init() runs.
 */
export const getSpotifyClient = (): SpotifyClient => {
    client ??= createSpotifyClient(() => ({
        clientId: process.env.spotifyClientId,
        clientSecret: process.env.spotifyClientSecret,
        refreshToken: process.env.spotifyRefreshToken
    }))
    return client
}
