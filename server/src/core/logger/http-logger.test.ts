import express from "express";
import type { DestinationStream } from "pino";
import request from "supertest";

import { markExpectedAuthFailure } from "./expected-auth-failure";
import { globalErrorHandler } from "../errors/error.middleware";
import { notFoundHandler } from "../errors/not-found.middleware";
import {
  createHttpLogger,
  redactLegacyInvitationToken,
  sanitizeAccessLogRequest,
} from "./http-logger";
import { createLogger } from "./logger";

const createLogCapture = () => {
  const chunks: string[] = [];
  const stream: DestinationStream = {
    write: (chunk) => {
      chunks.push(chunk.toString());
    },
  };

  return {
    logs: () =>
      chunks
        .flatMap((chunk) => chunk.trim().split("\n"))
        .map((line) => JSON.parse(line)),
    logger: createLogger(stream, "info"),
  };
};

describe("HTTP access-log secret redaction", () => {
  it("redacts legacy invitation tokens from logged request URLs", () => {
    const loggedUrl = redactLegacyInvitationToken(
      "/accept-invitation?source=email&token=legacy-secret&next=%2Fapp",
    );

    expect(loggedUrl).toBe(
      "/accept-invitation?source=email&token=%5Bredacted%5D&next=%2Fapp",
    );
    expect(loggedUrl).not.toContain("legacy-secret");
  });

  it("excludes referrer headers without mutating the request", () => {
    const request = {
      headers: {
        accept: "application/json",
        referer:
          "https://app.example.test/accept-invitation?token=legacy-secret",
      },
      method: "POST",
      url: "/auth/invitations/accept",
    };

    const sanitized = sanitizeAccessLogRequest(request);

    expect(sanitized).toEqual({
      headers: { accept: "application/json" },
      method: "POST",
      url: "/auth/invitations/accept",
    });
    expect(request.headers.referer).toContain("legacy-secret");
    expect(JSON.stringify(sanitized)).not.toContain("legacy-secret");
  });

  it("redacts signed URL credentials and other sensitive query fields", () => {
    const loggedUrl = redactLegacyInvitationToken(
      "/download?employeeId=employee-1&X-Amz-Credential=private&X-Amz-Signature=secret&password=bad",
    );

    expect(loggedUrl).toContain("employeeId=employee-1");
    expect(loggedUrl).not.toContain("private");
    expect(loggedUrl).not.toContain("secret");
    expect(loggedUrl).not.toContain("password=bad");
  });

  it("emits expected 4xx responses once at info access level", async () => {
    const capture = createLogCapture();
    const app = express();
    app.use(createHttpLogger(capture.logger, true));
    app.get("/validation", (_request, response) => {
      response.status(422).json({ error: { code: "VALIDATION_ERROR" } });
    });

    await request(app).get("/validation").expect(422);

    expect(capture.logs()).toHaveLength(1);
    expect(capture.logs()[0].level).toBe(30);
  });

  it("emits a not-found response once at info access level", async () => {
    const capture = createLogCapture();
    const app = express();
    app.use(createHttpLogger(capture.logger, true));
    app.use(notFoundHandler);
    app.use(globalErrorHandler);

    await request(app).get("/missing").expect(404);

    expect(capture.logs()).toHaveLength(1);
    expect(capture.logs()[0]).toMatchObject({
      level: 30,
      responseTime: expect.any(Number),
    });
  });

  it("uses error access level for 5xx responses", async () => {
    const capture = createLogCapture();
    const app = express();
    app.use(createHttpLogger(capture.logger, true));
    app.get("/failure", (_request, response) => {
      response.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR" } });
    });

    await request(app).get("/failure").expect(500);

    expect(capture.logs()).toHaveLength(1);
    expect(capture.logs()[0].level).toBe(50);
  });

  it("keeps an explicit security warning without a duplicate access log", async () => {
    const capture = createLogCapture();
    const app = express();
    app.use(createHttpLogger(capture.logger, true));
    app.get("/login-failure", (request, response) => {
      markExpectedAuthFailure(request, response);
      capture.logger.warn(
        { reason: "INVALID_CREDENTIALS" },
        "Login attempt failed",
      );
      response.status(401).json({ error: { code: "INVALID_CREDENTIALS" } });
    });

    await request(app).get("/login-failure").expect(401);

    expect(capture.logs()).toHaveLength(1);
    expect(capture.logs()[0]).toMatchObject({
      level: 40,
      msg: "Login attempt failed",
      reason: "INVALID_CREDENTIALS",
    });
  });

  it("redacts sensitive headers, query/body values, files, and private URLs", () => {
    const capture = createLogCapture();
    capture.logger.info({
      req: {
        body: {
          objectKey: "private-object-key",
          password: "body-password",
          signedUrl: "https://private.test/file?signature=secret",
          token: "body-token",
        },
        file: Buffer.from("raw-file"),
        headers: {
          authorization: "Bearer auth-token",
          cookie: "session=secret-cookie",
        },
        query: {
          password: "query-password",
          token: "query-token",
        },
      },
    });

    const serialized = JSON.stringify(capture.logs());
    for (const secret of [
      "private-object-key",
      "body-password",
      "private.test",
      "body-token",
      "raw-file",
      "auth-token",
      "secret-cookie",
      "query-password",
      "query-token",
    ]) {
      expect(serialized).not.toContain(secret);
    }
    expect(serialized).toContain("[redacted]");
  });
});
