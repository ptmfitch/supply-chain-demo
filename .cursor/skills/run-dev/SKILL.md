---
name: run-dev
description: >-
  Starts Colima, the local Mongo replica set (stockly-mongo on :27017), and
  Next.js (`npm run dev` on http://localhost:3000). Use when the user asks to
  start, run, boot, or bounce the app or related services; pull latest then
  start; or restart the local stack. Also use when login fails with Prisma
  P2010 / Mongo connection refused on localhost:27017.
---

# Run local stack

Bring **Mongo + Next** up every time. Login needs `localhost:27017` replica set `rs0`. Do not start Next alone and wait for a 30s login timeout.

Repo root. App URL: `http://localhost:3000`. Commands need host permissions (`all`) — Colima, Docker, and `.cursor/hooks` writes are blocked in the sandbox.

## Pull (only if asked)

If the user asked to pull / update / sync latest: `git pull` with `all` permissions first. Sandbox cannot write `.cursor/hooks.json`.

## Stop Next (every invoke that starts or stops the app)

Kill only TCP **LISTEN** on port **3000**. Leave **27017** alone.

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

## Mongo (every start)

Execute, do not rewrite:

```bash
bash .cursor/skills/run-dev/scripts/ensure-mongo.sh
```

**Done when** stdout includes `USER_COUNT=` and `Mongo ready`.

- Cloud Agent VMs: `.cursor/start.sh` already uses `sudo docker`. If 27017 is already PRIMARY, skip this script.
- Empty DB (`USER_COUNT=0`): follow [seed-dev-database](../seed-dev-database/SKILL.md) (`--with-catalog --skip-redis`). Do not wipe a DB that already has users.
- Redis / QStash stay optional. Report graceful degradation; do not start them.

## Next

After Mongo is ready (or 3000 is already free on a stop-only skip):

1. From the repo root, run `npm run dev` in the **background** (`block_until_ms: 0`). Do not use `npm start`.
2. Wait until stdout matches `Ready` or `localhost:3000`, or until `curl -sf -o /dev/null http://localhost:3000` succeeds (up to ~45s). A 307 to `/login` is success.
3. If the process exits immediately, read the log (missing `DATABASE_URL` / `JWT_SECRET` / `NEXT_PUBLIC_API_URL`) and report it. Do not invent env values.

**Done when** Next is Ready and port 3000 responds.

## Report

- App: `http://localhost:3000`
- Demo logins (password `12345678`): `test@admin.com` / `test@client.com` / `test@supplier.com`
- If Mongo was down and is now up, say so — login will hang ~30s with Prisma `P2010` until PRIMARY is reachable ([SCD-25](https://fe-anysphere-demo.atlassian.net/browse/SCD-25)).
