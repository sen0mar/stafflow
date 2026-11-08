import { Prisma } from "@prisma/client";

import { isSerializationConflict } from "./leave.repository";

describe("leave serialization conflict detection", () => {
  it("recognizes Prisma query conflicts and PostgreSQL adapter commit conflicts", () => {
    expect(
      isSerializationConflict(
        new Prisma.PrismaClientKnownRequestError("Conflict", {
          clientVersion: "7.8.0",
          code: "P2034",
        }),
      ),
    ).toBe(true);
    expect(
      isSerializationConflict(
        new Error("TransactionWriteConflict", {
          cause: { kind: "TransactionWriteConflict", originalCode: "40001" },
        }),
      ),
    ).toBe(true);
  });

  it("does not retry unrelated database errors or untrusted thrown values", () => {
    for (const error of [
      null,
      "40001",
      new Error("Connection refused"),
      new Error("Constraint violation", {
        cause: { kind: "UniqueConstraintViolation", originalCode: "23505" },
      }),
      new Prisma.PrismaClientKnownRequestError("Duplicate", {
        clientVersion: "7.8.0",
        code: "P2002",
      }),
    ]) {
      expect(isSerializationConflict(error)).toBe(false);
    }
  });
});
