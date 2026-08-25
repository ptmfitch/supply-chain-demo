#!/usr/bin/env bash
# Cloud Agent install phase — durable, source-derived setup captured in the
# environment snapshot. Runs after checkout. Must be idempotent and terminate.
#
# MongoDB is provided via Docker because the official MongoDB apt/download hosts
# are outside the Cloud Agent egress allowlist, whereas the Ubuntu archive
# (docker.io package) and docker.io registry (mongo image) are reachable.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> [install] System packages: Docker + fuse-overlayfs (rootless-capable storage driver)"
sudo apt-get update -o Acquire::Retries=3
# --force-confold keeps the existing /etc/fuse.conf so the fuse3 postinst does
# not block on an interactive conffile prompt in a non-tty build.
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
  -o Dpkg::Options::=--force-confold \
  docker.io containerd fuse-overlayfs
command -v dockerd >/dev/null || { echo "dockerd missing after install"; exit 1; }
command -v fuse-overlayfs >/dev/null || { echo "fuse-overlayfs missing after install"; exit 1; }

echo "==> [install] npm ci (postinstall runs prisma generate)"
npm ci

echo "==> [install] Pre-pull mongo:7 so boots are fast and do not require the registry"
# dockerd is not running during the build; start it briefly to cache the image
# into /var/lib/docker, which is part of the snapshot.
if ! sudo docker info >/dev/null 2>&1; then
  sudo bash -c 'nohup dockerd --storage-driver=fuse-overlayfs >/var/log/dockerd-install.log 2>&1 &'
  for _ in $(seq 1 30); do sudo docker info >/dev/null 2>&1 && break; sleep 1; done
fi
sudo docker info >/dev/null 2>&1 || { echo "dockerd failed to start during install"; exit 1; }
sudo docker pull mongo:7

echo "==> [install] Done"
