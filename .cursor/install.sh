#!/usr/bin/env bash
# Cloud Agent install phase — durable, source-derived setup captured in the
# environment snapshot. Runs after checkout. Must be idempotent and terminate.
#
# MongoDB is provided via Docker because official MongoDB apt/download hosts
# are outside the Cloud Agent egress allowlist. docker.io comes from Ubuntu
# apt (archive.ubuntu.com / security.ubuntu.com); the mongo image comes from
# docker.io (registry-1.docker.io). Both Ubuntu apt hosts must be allowlisted
# on this Ubuntu Noble image — Debian apt hosts in the default policy are not
# enough.
set -euo pipefail

cd "$(dirname "$0")/.."

need_docker_packages() {
  ! command -v dockerd >/dev/null 2>&1 || ! command -v fuse-overlayfs >/dev/null 2>&1
}

# Snapshot rebuilds already have node_modules; a fresh git checkout often leaves
# gitignored dirs in place. Skip npm ci when the lockfile install is present so
# a draft builder that still cannot reach registry.npmjs.org can succeed.
need_npm_ci() {
  ! [ -d node_modules/@prisma/client ] || ! [ -f node_modules/.package-lock.json ]
}

prefer_https_ubuntu_apt() {
  local sources="/etc/apt/sources.list.d/ubuntu.sources"
  if [ -f "$sources" ]; then
    sudo sed -i \
      -e 's|http://archive.ubuntu.com|https://archive.ubuntu.com|g' \
      -e 's|http://security.ubuntu.com|https://security.ubuntu.com|g' \
      "$sources"
  fi
}

echo "==> [install] System packages: Docker + fuse-overlayfs (rootless-capable storage driver)"
if need_docker_packages; then
  prefer_https_ubuntu_apt
  # --force-confold keeps the existing /etc/fuse.conf so the fuse3 postinst does
  # not block on an interactive conffile prompt in a non-tty build.
  if ! sudo apt-get update -o Acquire::Retries=3; then
    echo "ERROR: apt-get update failed. Cloud Agent egress must allow:" >&2
    echo "  - archive.ubuntu.com" >&2
    echo "  - security.ubuntu.com" >&2
    echo "Current policy allows Debian apt hosts (deb.debian.org) which this Ubuntu image does not use." >&2
    exit 1
  fi
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
    -o Dpkg::Options::=--force-confold \
    docker.io containerd fuse-overlayfs
else
  echo "   Docker + fuse-overlayfs already present; skipping apt"
fi
command -v dockerd >/dev/null || { echo "dockerd missing after install"; exit 1; }
command -v fuse-overlayfs >/dev/null || { echo "fuse-overlayfs missing after install"; exit 1; }

echo "==> [install] npm ci (postinstall runs prisma generate)"
if need_npm_ci; then
  if ! npm ci; then
    echo "ERROR: npm ci failed. Cloud Agent egress must allow:" >&2
    echo "  - registry.npmjs.org" >&2
    echo "  - binaries.prisma.sh  (prisma generate engines)" >&2
    exit 1
  fi
else
  echo "   node_modules already present; skipping npm ci"
fi

echo "==> [install] Pre-pull mongo:7 so boots are fast and do not require the registry"
# Best-effort: dockerd is not running during the build, so start it briefly to
# cache the image into /var/lib/docker (part of the snapshot). If a build pod
# cannot run dockerd, start.sh pulls the image on first boot instead, so this
# must not fail the install.
pull_mongo_image() {
  if ! sudo docker info >/dev/null 2>&1; then
    sudo bash -c 'nohup dockerd --storage-driver=fuse-overlayfs >/var/log/dockerd-install.log 2>&1 &'
    for _ in $(seq 1 30); do sudo docker info >/dev/null 2>&1 && break; sleep 1; done
  fi
  if sudo docker info >/dev/null 2>&1; then
    if sudo docker image inspect mongo:7 >/dev/null 2>&1; then
      echo "   mongo:7 already present; skipping pull"
    else
      sudo docker pull mongo:7
    fi
  else
    echo "   WARN: dockerd unavailable during install; start.sh will pull mongo:7 on first boot"
  fi
}
pull_mongo_image || echo "   WARN: mongo:7 pre-pull skipped; start.sh will pull on first boot"

echo "==> [install] Done"
