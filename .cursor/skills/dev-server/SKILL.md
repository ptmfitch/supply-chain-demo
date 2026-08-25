---
name: dev-server
description: >-
  Stops then starts the local Next.js Turbopack dev server for this repo
  (`npm run dev` on http://localhost:3000). Use whenever this skill is
  invoked, or when the user asks to start, stop, restart, or bounce the
  dev server.
disable-model-invocation: true
---

# Dev server

On **every invoke**, stop the existing Next.js process on port **3000**, then start a fresh one. Do not skip the stop step. Do not leave a second server on the same port.

Repo root. Command is `npm run dev` (`next dev --turbo`). App URL: `http://localhost:3000`.

## Stop

Kill only TCP **LISTEN** on port 3000 (Next.js). Do not kill MongoDB (27017) or other ports.

```bash
PIDS="$(lsof -ti tcp:3000 -sTCP:LISTEN 2>/dev/null || true)"
if [ -n "$PIDS" ]; then
  kill $PIDS 2>/dev/null || true
  sleep 0.4
  PIDS="$(lsof -ti tcp:3000 -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$PIDS" ]; then kill -9 $PIDS 2>/dev/null || true; fi
fi
```

**Stop only:** if the user asked only to stop, run the block above and stop. Do not start.

## Start

After stop (or if 3000 is already free):

1. From the repo root, run `npm run dev` in the **background** (`block_until_ms: 0`). Do not use `npm start`.
2. Wait until stdout matches `Ready` or `localhost:3000`, or until `curl -sf -o /dev/null http://localhost:3000` succeeds (up to ~45s).
3. If the process exits immediately, read the log (missing `DATABASE_URL` / `JWT_SECRET` / `NEXT_PUBLIC_API_URL`) and report it. Do not invent env values.

Cloud Agent VMs already use `.cursor/start.sh` for Mongo + seed. Locally, do not run `start.sh` unless Next fails because Mongo is down.

## Do not

- Start a second `npm run dev` while 3000 is still bound.
- `kill` by name across the machine (`pkill node`) — too broad.
- Change `package.json` scripts or commit `.env`.
