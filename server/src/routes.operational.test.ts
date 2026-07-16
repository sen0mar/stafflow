import request from "supertest";

import { createApp } from "./app";

describe("operational health routes", () => {
  it("keeps liveness cheap and independent from the database", async () => {
    const checkDatabase = vi.fn().mockRejectedValue(new Error("database down"));

    await request(createApp({ checkDatabase }))
      .get("/health")
      .expect(200)
      .expect({ data: { status: "ok" } });

    expect(checkDatabase).not.toHaveBeenCalled();
  });

  it("reports database readiness with a stable non-sensitive contract", async () => {
    await request(
      createApp({ checkDatabase: vi.fn().mockResolvedValue(undefined) }),
    )
      .get("/ready")
      .expect(200)
      .expect({ data: { status: "ready" } });

    await request(
      createApp({
        checkDatabase: vi
          .fn()
          .mockRejectedValue(new Error("secret database URL")),
      }),
    )
      .get("/ready")
      .expect(503)
      .expect({ data: { status: "not_ready" } });
  });

  it("bounds readiness checks and preserves request IDs", async () => {
    const startedAt = Date.now();
    const response = await request(
      createApp({
        checkDatabase: () => new Promise<void>(() => undefined),
        readinessTimeoutMs: 25,
      }),
    )
      .get("/ready")
      .set("x-request-id", "readiness-check-1")
      .expect(503)
      .expect("x-request-id", "readiness-check-1");

    expect(Date.now() - startedAt).toBeLessThan(500);
    expect(response.body).toEqual({ data: { status: "not_ready" } });
  });
});
