import request from "supertest";

import { createApp } from "../../app";
import { env } from "../../config/env";

describe("auth app configuration", () => {
  it("exposes only the sanitized demo-mode flag", async () => {
    const originalDemoMode = env.DEMO_MODE;
    env.DEMO_MODE = true;

    try {
      await request(createApp())
        .get("/auth/config")
        .expect(200)
        .expect("Cache-Control", "no-store")
        .expect(({ body }) => {
          expect(body).toEqual({ data: { demoMode: true } });
        });
    } finally {
      env.DEMO_MODE = originalDemoMode;
    }
  });

  it("prevents caching even when a session response is unauthorized", async () => {
    await request(createApp())
      .get("/auth/me")
      .expect(401)
      .expect("Cache-Control", "no-store");
  });

  it("prevents caching signed-download responses before authorization", async () => {
    await request(createApp())
      .get("/payslips/payslip-id/download")
      .expect(401)
      .expect("Cache-Control", "no-store");
  });
});
