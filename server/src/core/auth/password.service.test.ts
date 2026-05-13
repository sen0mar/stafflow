import { AppError } from "../errors/app-error";
import {
  hashPassword,
  validatePasswordConstraints,
  verifyPassword,
} from "./password.service";

describe("password.service", () => {
  it("hashes valid passwords and verifies matches only", async () => {
    const hash = await hashPassword("correct horse battery staple");

    expect(hash).not.toBe("correct horse battery staple");
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(
      true,
    );
    expect(await verifyPassword("incorrect password", hash)).toBe(false);
  });

  it("rejects passwords shorter than policy", () => {
    expect(() => validatePasswordConstraints("too-short")).toThrow(AppError);
  });

  it("rejects passwords beyond bcrypt byte limit", () => {
    const overLimit = "a".repeat(73);

    expect(() => validatePasswordConstraints(overLimit)).toThrow(AppError);
  });
});
