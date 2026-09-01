#!/usr/bin/env bash
# Idempotent local Mongo for supply-chain-demo: Colima (if needed), stockly-mongo, rs0 PRIMARY.
# No sudo dockerd. No seed. Prints USER_COUNT=N on success.
set -euo pipefail

MONGO_CONTAINER="stockly-mongo"
MONGO_VOLUME="stockly-mongo-data"
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"

docker_ok() {
  docker info >/dev/null 2>&1
}

if ! docker_ok; then
  if command -v colima >/dev/null 2>&1; then
    echo "==> [run-dev] Starting Colima"
    colima start
  else
    echo "Docker is down and colima is not installed. Start Docker, then retry." >&2
    exit 1
  fi
fi
docker_ok || { echo "Docker still unavailable after Colima start." >&2; exit 1; }

if docker ps -a --format '{{.Names}}' | grep -qx "$MONGO_CONTAINER"; then
  echo "==> [run-dev] Starting $MONGO_CONTAINER"
  docker start "$MONGO_CONTAINER" >/dev/null
else
  echo "==> [run-dev] Creating $MONGO_CONTAINER (mongo:7 --replSet rs0)"
  docker run -d --name "$MONGO_CONTAINER" -p 27017:27017 \
    -v "$MONGO_VOLUME":/data/db mongo:7 --replSet rs0 --bind_ip_all >/dev/null
fi

echo "==> [run-dev] Wait for mongod ping"
ok=0
for _ in $(seq 1 60); do
  if docker exec "$MONGO_CONTAINER" mongosh --quiet --eval 'db.runCommand({ ping: 1 }).ok' 2>/dev/null | grep -q 1; then
    ok=1
    break
  fi
  sleep 1
done
[ "$ok" = 1 ] || { echo "mongod failed to accept connections" >&2; exit 1; }

docker exec "$MONGO_CONTAINER" mongosh --quiet --eval \
  'try { rs.status().ok } catch (e) { rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "localhost:27017" }] }) }' >/dev/null

echo "==> [run-dev] Wait for PRIMARY"
ok=0
for _ in $(seq 1 60); do
  if docker exec "$MONGO_CONTAINER" mongosh --quiet --eval 'db.hello().isWritablePrimary' 2>/dev/null | grep -q true; then
    ok=1
    break
  fi
  sleep 1
done
[ "$ok" = 1 ] || { echo "MongoDB replica set failed to reach PRIMARY" >&2; exit 1; }

USER_COUNT="$(docker exec "$MONGO_CONTAINER" mongosh stockly --quiet --eval 'db.User.countDocuments()' 2>/dev/null | tr -dc '0-9')"
echo "USER_COUNT=${USER_COUNT:-0}"
echo "==> [run-dev] Mongo ready on localhost:27017 (rs0 PRIMARY)"
