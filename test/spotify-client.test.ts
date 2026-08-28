import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSpotifyClient, SpotifyError, type SpotifyCredentials } from '../spotify/spotify-client.ts'

const CREDENTIALS: SpotifyCredentials = {
    clientId: 'client-id',
    clientSecret: 'client-secret',
    refreshToken: 'refresh-token'
}

type Call = { url: string, init: RequestInit }

/**
 * A fetch that answers each call from the given queue, recording what it was
 * asked for.
 */
const stubFetch = (responses: (() => Response)[]) => {
    const calls: Call[] = []
    const fetchImpl = (async (url: string | URL | Request, init: RequestInit = {}) => {
        calls.push({ url: url.toString(), init: init })
        const next = responses.shift()
        if (!next) {
            throw new Error(`Unexpected request to ${url}`)
        }
        return next()
    }) as unknown as typeof fetch

    return { calls, fetchImpl }
}

const tokenResponse = (accessToken: string, expiresIn = 3600) => () =>
    new Response(JSON.stringify({ access_token: accessToken, token_type: 'Bearer', expires_in: expiresIn }), { status: 200 })

const jsonResponse = (body: unknown, status = 200) => () =>
    new Response(JSON.stringify(body), { status: status })

const authorizationOf = (call: Call) => (call.init.headers as Record<string, string>).Authorization

test('requests an app token with basic auth and the client credentials grant', async () => {
    const { calls, fetchImpl } = stubFetch([tokenResponse('app-token'), jsonResponse({ name: 'Kid A' })])
    const client = createSpotifyClient(() => CREDENTIALS, fetchImpl, () => 0)

    const album = await client.request<{ name: string }>('/albums/abc')

    assert.equal(album.name, 'Kid A')
    assert.equal(calls[0].url, 'https://accounts.spotify.com/api/token')
    assert.equal(authorizationOf(calls[0]), `Basic ${Buffer.from('client-id:client-secret').toString('base64')}`)
    assert.equal((calls[0].init.body as URLSearchParams).get('grant_type'), 'client_credentials')
    assert.equal(calls[1].url, 'https://api.spotify.com/v1/albums/abc')
    assert.equal(authorizationOf(calls[1]), 'Bearer app-token')
})

test('reuses a cached token until it is close to expiring', async () => {
    const { calls, fetchImpl } = stubFetch([
        tokenResponse('app-token'),
        jsonResponse({ name: 'first' }),
        jsonResponse({ name: 'second' })
    ])
    let currentTime = 0
    const client = createSpotifyClient(() => CREDENTIALS, fetchImpl, () => currentTime)

    await client.request('/albums/abc')
    currentTime = 3_000_000
    await client.request('/albums/def')

    assert.equal(calls.filter(call => call.url.includes('accounts.spotify.com')).length, 1)
})

test('mints a new token once the cached one expires', async () => {
    const { calls, fetchImpl } = stubFetch([
        tokenResponse('first-token'),
        jsonResponse({}),
        tokenResponse('second-token'),
        jsonResponse({})
    ])
    let currentTime = 0
    const client = createSpotifyClient(() => CREDENTIALS, fetchImpl, () => currentTime)

    await client.request('/albums/abc')
    // Past the token's lifetime, less the renewal margin.
    currentTime = 3_600_000
    await client.request('/albums/def')

    assert.equal(calls.filter(call => call.url.includes('accounts.spotify.com')).length, 2)
    assert.equal(authorizationOf(calls[3]), 'Bearer second-token')
})

test('uses the refresh token grant for user requests', async () => {
    const { calls, fetchImpl } = stubFetch([tokenResponse('user-token'), jsonResponse({ snapshot_id: 'abc' })])
    const client = createSpotifyClient(() => CREDENTIALS, fetchImpl, () => 0)

    await client.request('/playlists/xyz/tracks', {
        method: 'POST',
        body: { uris: ['spotify:track:1'] },
        as: 'user'
    })

    const tokenBody = calls[0].init.body as URLSearchParams
    assert.equal(tokenBody.get('grant_type'), 'refresh_token')
    assert.equal(tokenBody.get('refresh_token'), 'refresh-token')
    assert.equal(calls[1].init.method, 'POST')
    assert.equal(calls[1].init.body, JSON.stringify({ uris: ['spotify:track:1'] }))
})

test('keeps app and user tokens apart', async () => {
    const { calls, fetchImpl } = stubFetch([
        tokenResponse('app-token'),
        jsonResponse({}),
        tokenResponse('user-token'),
        jsonResponse({})
    ])
    const client = createSpotifyClient(() => CREDENTIALS, fetchImpl, () => 0)

    await client.request('/albums/abc')
    await client.request('/playlists/xyz/tracks', { method: 'POST', as: 'user' })

    assert.equal(authorizationOf(calls[1]), 'Bearer app-token')
    assert.equal(authorizationOf(calls[3]), 'Bearer user-token')
})

test('replaces a token that was revoked behind our back', async () => {
    const { calls, fetchImpl } = stubFetch([
        tokenResponse('stale-token'),
        jsonResponse({ error: 'expired' }, 401),
        tokenResponse('fresh-token'),
        jsonResponse({ name: 'Kid A' })
    ])
    const client = createSpotifyClient(() => CREDENTIALS, fetchImpl, () => 0)

    const album = await client.request<{ name: string }>('/albums/abc')

    assert.equal(album.name, 'Kid A')
    assert.equal(authorizationOf(calls[3]), 'Bearer fresh-token')
})

test('throws with the status when a request fails', async () => {
    const { fetchImpl } = stubFetch([tokenResponse('app-token'), jsonResponse({ error: 'not found' }, 404)])
    const client = createSpotifyClient(() => CREDENTIALS, fetchImpl, () => 0)

    await assert.rejects(
        () => client.request('/albums/missing'),
        (error: SpotifyError) => {
            assert.equal(error.status, 404)
            assert.match(error.message, /not found/)
            return true
        }
    )
})

test('handles an empty response body', async () => {
    const { fetchImpl } = stubFetch([tokenResponse('app-token'), () => new Response(null, { status: 204 })])
    const client = createSpotifyClient(() => CREDENTIALS, fetchImpl, () => 0)

    assert.equal(await client.request('/playlists/xyz/tracks', { method: 'POST' }), undefined)
})

test('reports what it is configured to do', async () => {
    const { fetchImpl } = stubFetch([])

    const unconfigured = createSpotifyClient(() => ({
        clientId: undefined,
        clientSecret: undefined,
        refreshToken: undefined
    }), fetchImpl, () => 0)
    assert.equal(unconfigured.canRead(), false)
    assert.equal(unconfigured.canWritePlaylists(), false)

    const readOnly = createSpotifyClient(() => ({ ...CREDENTIALS, refreshToken: undefined }), fetchImpl, () => 0)
    assert.equal(readOnly.canRead(), true)
    assert.equal(readOnly.canWritePlaylists(), false)

    assert.equal(createSpotifyClient(() => CREDENTIALS, fetchImpl, () => 0).canWritePlaylists(), true)
})

test('refuses to call spotify without credentials rather than sending an empty token', async () => {
    const { calls, fetchImpl } = stubFetch([])
    const client = createSpotifyClient(() => ({
        clientId: undefined,
        clientSecret: undefined,
        refreshToken: undefined
    }), fetchImpl, () => 0)

    await assert.rejects(() => client.request('/albums/abc'), /not configured/)
    assert.equal(calls.length, 0)
})
