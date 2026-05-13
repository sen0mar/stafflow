import { afterEach, describe, expect, it, vi } from "vitest";

describe("demo upload guard", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("blocks payslip uploads when demo mode disables uploads", async () => {
    vi.stubEnv("DEMO_MODE", "true");
    vi.stubEnv("DEMO_UPLOADS_ENABLED", "false");

    const { assertDemoUploadsAllowed } = await import("./demo-upload.guard.js");

    expect(() => assertDemoUploadsAllowed()).toThrow(
      expect.objectContaining({
        code: "DEMO_UPLOADS_DISABLED",
        statusCode: 403,
      }),
    );
  });

  it("allows payslip uploads outside demo mode", async () => {
    vi.stubEnv("DEMO_MODE", "false");
    vi.stubEnv("DEMO_UPLOADS_ENABLED", "false");

    const { assertDemoUploadsAllowed } = await import("./demo-upload.guard.js");

    expect(() => assertDemoUploadsAllowed()).not.toThrow();
  });
});
