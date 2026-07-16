import { readFileSync } from "node:fs";
import path from "node:path";

interface VercelHeader {
  key: string;
  value: string;
}

interface VercelConfig {
  headers?: Array<{
    headers: VercelHeader[];
    source: string;
  }>;
}

const workspaceRoot = path.resolve(__dirname, "../../../..");
const configPaths = [
  path.join(workspaceRoot, "vercel.json"),
  path.join(workspaceRoot, "client/vercel.json"),
];

describe.each(configPaths)("Vercel browser headers in %s", (configPath) => {
  it("sets the baseline policy without guessing a deployment CSP", () => {
    const config = JSON.parse(readFileSync(configPath, "utf8")) as VercelConfig;
    const headers = Object.fromEntries(
      config.headers?.flatMap((entry) =>
        entry.headers.map(({ key, value }) => [key, value]),
      ) ?? [],
    );

    expect(headers).toMatchObject({
      "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
    });
    expect(headers).not.toHaveProperty("Content-Security-Policy");
  });
});
