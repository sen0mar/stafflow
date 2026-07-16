import request from "supertest";

import { createApp } from "../../src/app";

describe("deferred password recovery", () => {
  it.each([
    {
      body: { email: "employee@example.com" },
      path: "/auth/forgot-password",
    },
    {
      body: {
        newPassword: "ReplacementPassword",
        token: "a".repeat(43),
      },
      path: "/auth/reset-password",
    },
  ])("returns 404 for $path", async ({ body, path }) => {
    await request(createApp())
      .post(path)
      .send(body)
      .expect(404)
      .expect(({ body: responseBody }) => {
        expect(responseBody.error.code).toBe("NOT_FOUND");
      });
  });
});
