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

Each pick is discussed once. The reminder and the discussion prompt both skip a
pick that has already been discussed, so a week where nothing new is picked
passes quietly instead of repeating the last album.

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
| `spotifyRefreshToken` | no | Authorizes adding winning tracks to a playlist, which track polls require |
| `NODE_ENV` | no | `development` runs the jobs on a fast schedule and opens two-minute polls |

Without the Spotify variables the bot behaves as it always has: it just skips the
track poll and the playlist.

## Track polls

When the week's rec is a Spotify album link and the bot can write to the guild's
playlist, the Friday discussion prompt is preceded by a poll on the album's best
track. Discord polls hold at most ten answers, so an album longer than that is
cut off at its first ten tracks. The poll closes after 24 hours, and the winning
track is announced and added to the playlist. A tie is drawn at random.

Ranking the ballot by track popularity would be better than taking the first ten,
but Spotify only returns the `popularity` field to apps granted extended quota
mode; an app in development mode is refused it, along with every batch `?ids=`
endpoint.

A single-track release has nothing to vote on, so it skips the poll and goes
straight to the playlist.

Recs that aren't Spotify album links are left alone, as are guilds whose winner
would have nowhere to go: the discussion prompt goes up on its own, as before.

## Spotify setup

1. Create an app at <https://developer.spotify.com/dashboard>. Copy its client id
   and secret into `.env` as `spotifyClientId` and `spotifyClientSecret`.
2. Track polls also need a playlist to put their winners in. Add
   `http://127.0.0.1:8888/callback` as a redirect URI in the app's settings, then
   run:

   ```sh
   npm run spotify-auth
   ```

   Open the printed URL as the account that owns the playlist and approve. The
   script prints a `spotifyRefreshToken` line to add to `.env`.
3. In Discord, run `/recplaylist <playlist link>` to choose where winning tracks
   go. The authorizing account must be able to edit that playlist. Polls only run
   for guilds that have one set, since the winner has nowhere else to go.

## Discord permissions

The bot needs **Create Polls** in the club's channel on top of the usual
send-messages permissions. It was likely invited before polls existed, so this
may need adding to its role.
