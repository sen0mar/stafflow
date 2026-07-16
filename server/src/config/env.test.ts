import { ZodError } from "zod";

import { parseEnv } from "./env";

const validEnv = {
  CLIENT_URL: "https://app.example.test",
  DATABASE_URL: "postgresql://database.example.test/stafflow",
  DEMO_MODE: "false",
  DEMO_UPLOADS_ENABLED: "false",
  NODE_ENV: "production",
  PORT: "4000",
};

describe("environment validation", () => {
  it.each(["0", "65536", "1.5", "not-a-port"])(
    "rejects invalid port %s",
    (port) => {
      expect(() => parseEnv({ ...validEnv, PORT: port })).toThrow(ZodError);
    },
  );

  it("accepts the full valid port range", () => {
    expect(parseEnv({ ...validEnv, PORT: "1" }).PORT).toBe(1);
    expect(parseEnv({ ...validEnv, PORT: "65535" }).PORT).toBe(65_535);
  });

  it("requires HTTPS client origins only in production", () => {
    expect(() =>
      parseEnv({ ...validEnv, CLIENT_URL: "http://app.example.test" }),
    ).toThrow(/HTTPS/);
    expect(
      parseEnv({
        ...validEnv,
        CLIENT_URL: "http://localhost:5173",
        NODE_ENV: "test",
      }).CLIENT_URL,
    ).toBe("http://localhost:5173");
  });

  it("fails closed when demo uploads are enabled without quota and cleanup controls", () => {
    expect(() =>
      parseEnv({
        ...validEnv,
        DEMO_MODE: "true",
        DEMO_UPLOADS_ENABLED: "true",
      }),
    ).toThrow(/quotas and automated cleanup/);

    expect(() =>
      parseEnv({ ...validEnv, DEMO_UPLOADS_ENABLED: "true" }),
    ).toThrow(/quotas and automated cleanup/);
  });
});
