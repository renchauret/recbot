# recbot

A Discord bot that picks a weekly music recommendation from a shared queue,
reminds the server partway through the week, and prompts discussion when the
week is up.

## Running locally

```bash
npm install
npm start
```

`npm start` needs Node 22.6+ for `--experimental-strip-types`. The `node`
dependency vendors a matching runtime at `node_modules/node/bin/node` if the
system Node is older.

`token` and `mongodbUri` are read from a `.env` file in the repo root.

Set `NODE_ENV=development` to swap the weekly schedule for one that fires every
minute, which is easier to test against.

## Running on the Raspberry Pi

The bot runs under systemd so it restarts after a crash and comes back after a
power cut. [`deploy/recbot.service`](deploy/recbot.service) is the unit file; it
assumes the repo is at `/home/ren/Documents/projects/recbot` and runs as user
`ren`.

```bash
sudo cp deploy/recbot.service /etc/systemd/system/recbot.service
sudo systemctl daemon-reload
sudo systemctl enable --now recbot
```

Check that it came up:

```bash
systemctl status recbot
```

### Logs

Output goes to the journal rather than a file:

```bash
journalctl -u recbot -f                    # follow
journalctl -u recbot --since "1 hour ago"  # after the fact
journalctl -u recbot -p err                # errors only
```

### After pulling changes

```bash
git pull && npm install
sudo systemctl restart recbot
```

Editing `deploy/recbot.service` in the repo does nothing on its own — copy it to
`/etc/systemd/system/` and `sudo systemctl daemon-reload` again.

### Notes

`node_modules/node` holds a real binary for the architecture it was installed
on, so run `npm install` on the Pi itself. A `node_modules` copied from an x86
machine will fail to exec.

The unit deliberately sets `StartLimitIntervalSec=0`. systemd otherwise stops
retrying a unit that restarts 5 times within 10 seconds and leaves it down until
someone notices, which is the failure this setup is meant to avoid.
