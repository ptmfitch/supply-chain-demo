import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SCRIPT = readFileSync(
  path.join(process.cwd(), ".cursor/install.sh"),
  "utf8",
);

describe("Cloud Agent install.sh smoke (PR #23)", () => {
  it("skips apt when dockerd and fuse-overlayfs are already on the snapshot", () => {
    expect(SCRIPT).toContain("need_docker_packages()");
    expect(SCRIPT).toMatch(/command -v dockerd/);
    expect(SCRIPT).toMatch(/command -v fuse-overlayfs/);
    expect(SCRIPT).toContain("skipping apt");
  });

  it("skips npm ci when the lockfile install is already present", () => {
    expect(SCRIPT).toContain("need_npm_ci()");
    expect(SCRIPT).toContain("node_modules/@prisma/client");
    expect(SCRIPT).toContain("node_modules/.package-lock.json");
    expect(SCRIPT).toContain("skipping npm ci");
  });

  it("rewrites Ubuntu apt sources to HTTPS before a real apt-get update", () => {
    expect(SCRIPT).toContain("prefer_https_ubuntu_apt()");
    expect(SCRIPT).toContain("https://archive.ubuntu.com");
    expect(SCRIPT).toContain("https://security.ubuntu.com");
  });

  it("skips mongo:7 pull when the image is already local", () => {
    expect(SCRIPT).toContain("mongo:7 already present; skipping pull");
  });
});
