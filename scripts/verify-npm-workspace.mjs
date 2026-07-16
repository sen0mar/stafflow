import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (path) =>
  JSON.parse(readFileSync(resolve(repositoryRoot, path), "utf8"));

const packageJson = readJson("package.json");
const packageLock = readJson("package-lock.json");
const trackedFiles = execFileSync("git", ["ls-files"], {
  cwd: repositoryRoot,
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .filter(Boolean);
const lockNames = new Set([
  "bun.lock",
  "bun.lockb",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
]);
const trackedLocks = trackedFiles.filter(
  (path) =>
    lockNames.has(path.split("/").at(-1)) &&
    existsSync(resolve(repositoryRoot, path)),
);
const errors = [];

if (trackedLocks.length !== 1 || trackedLocks[0] !== "package-lock.json") {
  errors.push(
    `Expected package-lock.json to be the only tracked package-manager lock; found: ${trackedLocks.join(", ") || "none"}.`,
  );
}

for (const workspace of packageJson.workspaces ?? []) {
  if (!packageLock.packages?.[workspace]) {
    errors.push(
      `Root package-lock.json does not cover workspace: ${workspace}.`,
    );
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(error);
  }

  process.exit(1);
}

console.log(
  "Root package-lock.json is the canonical lock for every npm workspace.",
);
