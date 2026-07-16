import { afterEach, describe, expect, it, vi } from "vitest";

describe("demo account guard", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("returns the stable demo read-only error in demo mode", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://localhost/stafflow_test");
    vi.stubEnv("DEMO_MODE", "true");

    const { assertDemoAccountMutationAllowed } =
      await import("./demo-account.guard.js");

    expect(() => assertDemoAccountMutationAllowed()).toThrow(
      expect.objectContaining({
        code: "DEMO_READ_ONLY",
        statusCode: 403,
      }),
    );
  });

  it("allows account mutations outside demo mode", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://localhost/stafflow_test");
    vi.stubEnv("DEMO_MODE", "false");

    const { assertDemoAccountMutationAllowed } =
      await import("./demo-account.guard.js");

    expect(() => assertDemoAccountMutationAllowed()).not.toThrow();
  });
});
