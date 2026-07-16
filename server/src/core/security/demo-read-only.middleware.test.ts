import { afterEach, describe, expect, it, vi } from "vitest";

describe("demo read-only middleware", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("returns the stable demo read-only error in demo mode", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://localhost/stafflow_test");
    vi.stubEnv("DEMO_MODE", "true");

    const { assertDemoMutationAllowed } =
      await import("./demo-read-only.middleware.js");

    expect(() => assertDemoMutationAllowed()).toThrow(
      expect.objectContaining({
        code: "DEMO_READ_ONLY",
        statusCode: 403,
      }),
    );
  });

  it("allows mutations outside demo mode", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://localhost/stafflow_test");
    vi.stubEnv("DEMO_MODE", "false");

    const { assertDemoMutationAllowed } =
      await import("./demo-read-only.middleware.js");

    expect(() => assertDemoMutationAllowed()).not.toThrow();
  });
});
