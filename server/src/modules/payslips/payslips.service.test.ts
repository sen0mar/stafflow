import type { AuthContext } from "../../core/auth/auth.types";
import type { PayslipRecord } from "./payslips.repository";
import { findPayslipById } from "./payslips.repository";
import { getPayslipDetail, getPayslipDownload } from "./payslips.service";

vi.mock("../../core/storage/r2.service", () => ({
  createPayslipObjectKey: vi.fn(),
  createPrivateDownloadUrl: vi.fn(async () => ({
    expiresAt: new Date("2026-05-13T12:00:00.000Z"),
    url: "https://example.test/private-url",
  })),
  deletePrivateObject: vi.fn(),
  uploadPrivatePayslipPdf: vi.fn(),
}));

vi.mock("./demo-upload.guard", () => ({
  assertDemoUploadsAllowed: vi.fn(),
}));

vi.mock("./payslips.repository", () => ({
  createOrReplacePayslipWithAuditLog: vi.fn(),
  deletePayslipWithAuditLog: vi.fn(),
  findEmployeeForPayslip: vi.fn(),
  findPayslipById: vi.fn(),
  listPayslips: vi.fn(),
  listSelfPayslips: vi.fn(),
}));

const auth: AuthContext = {
  employeeId: "employee-1",
  permissions: ["payslips:read:self"],
  role: "EMPLOYEE",
  sessionId: "session-1",
  user: {
    email: "employee@example.com",
    employee: { firstName: "Maya", id: "employee-1", lastName: "Rivers" },
    employeeId: "employee-1",
    id: "user-1",
    role: "EMPLOYEE",
    status: "ACTIVE",
  },
  userId: "user-1",
};

const payslip = (overrides: Partial<PayslipRecord> = {}): PayslipRecord => ({
  contentType: "application/pdf",
  createdAt: new Date("2026-05-01T00:00:00.000Z"),
  deletedAt: null,
  employee: {
    department: { id: "department-1", name: "Engineering" },
    employeeCode: "EMP-001",
    firstName: "Maya",
    id: "employee-1",
    lastName: "Rivers",
  },
  employeeId: "employee-1",
  fileName: "may-2026.pdf",
  fileSize: 1024,
  id: "payslip-1",
  month: 5,
  r2ObjectKey: "payslips/employee-1/2026/5.pdf",
  status: "ACTIVE",
  updatedAt: new Date("2026-05-01T00:00:00.000Z"),
  uploadedAt: new Date("2026-05-01T00:00:00.000Z"),
  uploadedBy: { email: "admin@example.com", id: "admin-1" },
  uploadedById: "admin-1",
  year: 2026,
  ...overrides,
});

describe("payslips.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks employees from another employee payslip detail", async () => {
    vi.mocked(findPayslipById).mockResolvedValue(
      payslip({ employeeId: "employee-2" }),
    );

    await expect(getPayslipDetail(auth, "payslip-1")).rejects.toMatchObject({
      code: "PAYSLIP_FORBIDDEN",
      statusCode: 403,
    });
  });

  it("blocks employees from another employee payslip download", async () => {
    vi.mocked(findPayslipById).mockResolvedValue(
      payslip({ employeeId: "employee-2" }),
    );

    await expect(getPayslipDownload(auth, "payslip-1")).rejects.toMatchObject({
      code: "PAYSLIP_FORBIDDEN",
      statusCode: 403,
    });
  });
});
