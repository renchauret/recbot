# recbot

A Discord bot for a music club. Members queue up album recommendations, one is
picked at random each week, and the club listens and discusses.

## Weekly schedule

| When | What |
|------|------|
| Wednesday 4 PM | Reminds anyone with an empty queue to add a rec |
| Friday 4 PM | Opens a poll for the best track on last week's album, then prompts a discussion |
| Friday 9 PM | Picks the next album from a random member's queue |
| Saturday 4 PM | Tallies the track poll and adds the winner to the club playlist |

## Running

```sh
npm install
npm start
```

`npm run deploy-commands` registers the slash commands with Discord. Run it
whenever a command is added or its description changes.

`npm test` runs the unit tests and `npm run typecheck` type checks the project.

## Environment

Configuration is read from `.env`:

| Variable | Required | Purpose |
|----------|----------|---------|
| `token` | yes | Discord bot token |
| `clientId` | yes | Discord application id, used to deploy slash commands |
| `mongodbUri` | yes | MongoDB connection string |
| `spotifyClientId` | no | Spotify app id, for reading album track lists |
| `spotifyClientSecret` | no | Spotify app secret |
| `spotifyRefreshToken` | no | Authorizes adding winning tracks to a playlist |
| `NODE_ENV` | no | `development` runs the jobs on a fast schedule |

Without the Spotify variables the bot behaves as it always has: it just skips the
track poll and the playlist.

## Track polls

When the week's rec is a Spotify album link, the Friday discussion prompt is
preceded by a poll on the album's best track. Discord polls hold at most ten
answers, so an album longer than that is trimmed to its ten most popular tracks,
listed in album order. The poll closes after 24 hours, and the winning track is
announced and added to the guild's playlist. Ties are broken at random.

Recs that aren't Spotify album links are left alone — the discussion prompt goes
up on its own, as before.

## Spotify setup

1. Create an app at <https://developer.spotify.com/dashboard>. Copy its client id
   and secret into `.env` as `spotifyClientId` and `spotifyClientSecret`. This is
   all that track polls need.
2. To let the bot maintain a playlist, add `http://127.0.0.1:8888/callback` as a
   redirect URI in the app's settings, then run:

   ```sh
   npm run spotify-auth
   ```

   Open the printed URL as the account that owns the playlist and approve. The
   script prints a `spotifyRefreshToken` line to add to `.env`.
3. In Discord, run `/recplaylist <playlist link>` to choose where winning tracks
   go. The authorizing account must be able to edit that playlist.

## Discord permissions

The bot needs **Create Polls** in the club's channel on top of the usual
send-messages permissions. It was likely invited before polls existed, so this
may need adding to its role.
