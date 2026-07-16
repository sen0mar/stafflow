vi.mock("../../config/env", () => ({
  env: {
    R2_ACCESS_KEY_ID: "test-access-key",
    R2_ACCOUNT_ID: "test-account",
    R2_BUCKET_NAME: "test-bucket",
    R2_SECRET_ACCESS_KEY: "test-secret-key",
  },
}));

import { getR2Client } from "./r2.client";

describe("getR2Client", () => {
  it("lazily reuses one configured client per process", () => {
    expect(getR2Client()).toBe(getR2Client());
  });
});
