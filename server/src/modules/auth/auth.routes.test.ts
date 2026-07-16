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
        .expect(({ body }) => {
          expect(body).toEqual({ data: { demoMode: true } });
        });
    } finally {
      env.DEMO_MODE = originalDemoMode;
    }
  });
});
