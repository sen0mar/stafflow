import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { loadSeedTarget, targetFingerprint } from "./target";

test("apply refuses ambiguous database targets, shared production storage, and unauthorized production", () => {
  const previous = process.cwd();
  const savedEnv = { ...process.env };
  const directory = mkdtempSync(join(tmpdir(), "stafflow-seed-guards-"));
  const development = "postgresql://localhost/stafflow_dev";
  const production = "postgresql://prod.example/stafflow";
  const storage =
    "\nR2_ACCOUNT_ID=account\nR2_BUCKET_NAME=shared\nR2_ACCESS_KEY_ID=key\nR2_SECRET_ACCESS_KEY=secret\n";
  try {
    process.chdir(directory);
    delete process.env.SEED_ALLOW_PRODUCTION;
    writeFileSync(
      ".env.local",
      `NODE_ENV=development\nDATABASE_URL=${development}${storage}`,
    );
    writeFileSync(
      ".env.production",
      `NODE_ENV=production\nDATABASE_URL=${production}${storage}`,
    );
    assert.throws(
      () => loadSeedTarget(["--apply", "--data-only"]),
      /preview first/,
    );
    assert.throws(
      () =>
        loadSeedTarget([
          "--apply",
          `--target=${targetFingerprint(production)}`,
          "--data-only",
        ]),
      /preview first/,
    );
    assert.throws(
      () =>
        loadSeedTarget([
          "--apply",
          `--target=${targetFingerprint(development)}`,
        ]),
      /bucket matches production/,
    );
    assert.throws(
      () =>
        loadSeedTarget([
          "--environment=production",
          "--apply",
          `--target=${targetFingerprint(production)}`,
          "--data-only",
        ]),
      /separate authorization/,
    );
    writeFileSync(
      ".env.local",
      `DATABASE_URL=${production}\nNODE_ENV=development`,
    );
    assert.throws(
      () => loadSeedTarget(["--data-only"]),
      /matches the configured production/,
    );
    writeFileSync(
      ".env.local",
      `DATABASE_URL=${development}\nNODE_ENV=development`,
    );
    process.env.DATABASE_URL = production;
    const result = loadSeedTarget([
      "--apply",
      `--target=${targetFingerprint(development)}`,
      "--data-only",
    ]);
    assert.equal(result.environment, "development");
    assert.equal(process.env.DATABASE_URL, development);
    assert.equal(process.env.R2_BUCKET_NAME, undefined);
  } finally {
    process.chdir(previous);
    process.env = savedEnv;
    rmSync(directory, { recursive: true, force: true });
  }
});
