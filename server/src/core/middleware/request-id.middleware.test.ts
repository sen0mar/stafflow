import express from "express";
import request from "supertest";

import {
  isTrustedRequestId,
  REQUEST_ID_MAX_CHARACTERS,
  requestIdMiddleware,
} from "./request-id.middleware";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const createApp = () => {
  const app = express();

  app.use(requestIdMiddleware);
  app.get("/", (_request, response) => {
    response.json({ requestId: response.locals.requestId });
  });

  return app;
};

describe("request ID trust boundary", () => {
  it("reflects a short allowlisted ASCII request ID", async () => {
    await request(createApp())
      .get("/")
      .set("x-request-id", "web-01:trace_2.3")
      .expect(200)
      .expect("x-request-id", "web-01:trace_2.3")
      .expect(({ body }) => {
        expect(body.requestId).toBe("web-01:trace_2.3");
      });
  });

  it.each([
    ["markup", "<script>alert(1)</script>"],
    ["non-ASCII text", "réquest-id"],
    ["a leading delimiter", "-request-id"],
    ["an oversized value", "a".repeat(REQUEST_ID_MAX_CHARACTERS + 1)],
  ])("replaces %s instead of reflecting it", async (_label, value) => {
    const response = await request(createApp())
      .get("/")
      .set("x-request-id", value)
      .expect(200);

    expect(response.headers["x-request-id"]).toMatch(uuidPattern);
    expect(response.body.requestId).toBe(response.headers["x-request-id"]);
    expect(response.headers["x-request-id"]).not.toBe(value);
  });

  it("does not trust surrounding whitespace before HTTP normalization", () => {
    expect(isTrustedRequestId(" request-id ")).toBe(false);
  });
});
