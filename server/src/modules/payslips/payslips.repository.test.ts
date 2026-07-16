const prismaMocks = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

vi.mock("../../prisma/prisma.client", () => ({
  prisma: {
    payslip: {
      findMany: prismaMocks.findMany,
    },
  },
}));

vi.mock("../audit-logs/audit-log.service", () => ({
  createAuditLog: vi.fn(),
}));

import { findSoftDeletedPayslipObjects } from "./payslips.repository";

describe("findSoftDeletedPayslipObjects", () => {
  it("selects only soft-deleted metadata and exposes no unrelated fields", async () => {
    prismaMocks.findMany.mockResolvedValue([]);

    await findSoftDeletedPayslipObjects({ skip: 0, take: 100 });

    expect(prismaMocks.findMany).toHaveBeenCalledWith({
      orderBy: [{ deletedAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        r2ObjectKey: true,
      },
      skip: 0,
      take: 100,
      where: {
        deletedAt: { not: null },
        status: "DELETED",
      },
    });
  });
});
