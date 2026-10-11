import { createServer } from 'node:http'
import { configDotenv } from 'dotenv'

// Spotify only accepts loopback redirect URIs by IP. This exact value has to be
// added to the app's settings in the Spotify developer dashboard.
const PORT = 8888
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`
const SCOPES = ['playlist-modify-public', 'playlist-modify-private']

configDotenv()

const clientId = process.env.spotifyClientId
const clientSecret = process.env.spotifyClientSecret

if (!clientId || !clientSecret) {
    console.error('Set spotifyClientId and spotifyClientSecret in .env first.')
    process.exit(1)
}

const exchangeCode = async (code: string): Promise<void> => {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI
        })
    })

    const body = await response.json() as { refresh_token?: string, error_description?: string }
    if (!response.ok || !body.refresh_token) {
        throw new Error(`Token exchange failed: ${body.error_description ?? JSON.stringify(body)}`)
    }

    console.log('\nAdd this to your .env:\n')
    console.log(`spotifyRefreshToken=${body.refresh_token}\n`)
}

const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', REDIRECT_URI)
    if (url.pathname !== '/callback') {
        response.writeHead(404).end()
        return
    }

    const error = url.searchParams.get('error')
    const code = url.searchParams.get('code')
    try {
        if (error || !code) {
            throw new Error(`Spotify returned: ${error ?? 'no authorization code'}`)
        }
        await exchangeCode(code)
        response.writeHead(200, { 'Content-Type': 'text/plain' })
            .end('Done. The refresh token was printed to the console. You can close this tab.')
    } catch (e) {
        console.error(e)
        response.writeHead(400, { 'Content-Type': 'text/plain' }).end(`Failed: ${e}`)
    } finally {
        server.close()
    }
})

server.listen(PORT, '127.0.0.1', () => {
    const authorizeUrl = new URL('https://accounts.spotify.com/authorize')
    authorizeUrl.search = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        scope: SCOPES.join(' '),
        redirect_uri: REDIRECT_URI,
        // The playlist owner must be the account that authorizes here.
        show_dialog: 'true'
    }).toString()

    console.log(`Add ${REDIRECT_URI} as a redirect URI in your Spotify app settings, then open:\n`)
    console.log(`${authorizeUrl}\n`)
})
