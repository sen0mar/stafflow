import type { AuthContext } from "../../core/auth/auth.types";
import { logger } from "../../core/logger/logger";
import {
  createPayslipObjectKey,
  createPrivateDownloadUrl,
  deletePrivateObject,
  uploadPrivatePayslipPdf,
} from "../../core/storage/r2.service";
import type { PayslipRecord } from "./payslips.repository";
import {
  createOrReplacePayslipWithAuditLog,
  deletePayslipWithAuditLog,
  findEmployeeForPayslip,
  findPayslipById,
  findSoftDeletedPayslipObjects,
} from "./payslips.repository";
import {
  deletePayslip,
  getPayslipDetail,
  getPayslipDownload,
  retrySoftDeletedPayslipObjectDeletes,
  uploadPayslip,
} from "./payslips.service";

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
  findSoftDeletedPayslipObjects: vi.fn(),
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

const adminAuth: AuthContext = {
  employeeId: null,
  permissions: ["payslips:delete", "payslips:read:any", "payslips:upload"],
  role: "ADMIN",
  sessionId: "admin-session-1",
  user: {
    email: "admin@example.com",
    employee: null,
    employeeId: null,
    id: "admin-1",
    role: "ADMIN",
    status: "ACTIVE",
  },
  userId: "admin-1",
};

const pdfFile = (originalname = "may-2026.pdf"): Express.Multer.File => ({
  buffer: Buffer.from("%PDF-test"),
  destination: "",
  encoding: "7bit",
  fieldname: "file",
  filename: "",
  mimetype: "application/pdf",
  originalname,
  path: "",
  size: 9,
  stream: undefined as never,
});

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

  it("cleans up the new object when metadata persistence fails", async () => {
    vi.mocked(findEmployeeForPayslip).mockResolvedValue({
      employeeCode: "EMP-001",
      firstName: "Maya",
      id: "employee-1",
      lastName: "Rivers",
      status: "ACTIVE",
    });
    vi.mocked(createPayslipObjectKey).mockReturnValue("private/new-key.pdf");
    vi.mocked(createOrReplacePayslipWithAuditLog).mockRejectedValue(
      new Error("database unavailable"),
    );

    await expect(
      uploadPayslip({
        auditContext: { actorUserId: "admin-1", requestId: "request-1" },
        file: pdfFile(),
        input: { employeeId: "employee-1", month: 5, year: 2026 },
      }),
    ).rejects.toThrow("database unavailable");

    expect(uploadPrivatePayslipPdf).toHaveBeenCalledWith({
      body: Buffer.from("%PDF-test"),
      key: "private/new-key.pdf",
    });
    expect(deletePrivateObject).toHaveBeenCalledWith("private/new-key.pdf");
  });

  it("sanitizes the display filename and cleans up a replaced object", async () => {
    vi.mocked(findEmployeeForPayslip).mockResolvedValue({
      employeeCode: "EMP-001",
      firstName: "Maya",
      id: "employee-1",
      lastName: "Rivers",
      status: "ACTIVE",
    });
    vi.mocked(createPayslipObjectKey).mockReturnValue("private/new-key.pdf");
    vi.mocked(createOrReplacePayslipWithAuditLog).mockResolvedValue({
      oldObjectKey: "private/old-key.pdf",
      payslip: payslip(),
    });

    await uploadPayslip({
      auditContext: { actorUserId: "admin-1", requestId: "request-2" },
      file: pdfFile("..\\pay\u0000<May>.PDF"),
      input: { employeeId: "employee-1", month: 5, year: 2026 },
    });

    expect(createOrReplacePayslipWithAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: "pay_May_.pdf" }),
    );
    expect(deletePrivateObject).toHaveBeenCalledWith("private/old-key.pdf");
  });

  it("retains soft-deleted metadata when immediate object deletion fails", async () => {
    const deletedPayslip = payslip({
      deletedAt: new Date("2026-05-15T12:00:00.000Z"),
      status: "DELETED",
    });
    vi.mocked(findPayslipById).mockResolvedValue(payslip());
    vi.mocked(deletePayslipWithAuditLog).mockResolvedValue(deletedPayslip);
    vi.mocked(deletePrivateObject).mockRejectedValueOnce({
      name: "ServiceUnavailable",
      $metadata: { httpStatusCode: 503 },
    });

    await expect(
      deletePayslip(adminAuth, "payslip-1", {
        actorUserId: "admin-1",
        requestId: "request-3",
      }),
    ).resolves.toMatchObject({ deletedAt: "2026-05-15T12:00:00.000Z" });

    expect(deletePayslipWithAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ id: "payslip-1" }),
    );
  });

  it("redacts object keys and signed URLs from storage failure logs", async () => {
    const privateKey = "payslips/private/secret-key.pdf";
    const signedUrl = "https://r2.example.test/file?signature=private";
    const logSpy = vi
      .spyOn(logger, "error")
      .mockImplementation(() => undefined);
    vi.mocked(findPayslipById).mockResolvedValue(
      payslip({ r2ObjectKey: privateKey }),
    );
    vi.mocked(createPrivateDownloadUrl).mockRejectedValueOnce(
      new Error(`${privateKey} ${signedUrl}`),
    );

    await expect(
      getPayslipDownload(adminAuth, "payslip-1", "request-redaction"),
    ).rejects.toMatchObject({ code: "PAYSLIP_DOWNLOAD_UNAVAILABLE" });

    const loggedPayload = JSON.stringify(logSpy.mock.calls);
    expect(loggedPayload).not.toContain(privateKey);
    expect(loggedPayload).not.toContain(signedUrl);
    expect(loggedPayload).toContain("request-redaction");
    expect(loggedPayload).toContain("payslip-1");
    expect(loggedPayload).toContain("unknown");
    logSpy.mockRestore();
  });

  it("retries only repository-selected soft-deleted objects idempotently", async () => {
    const logSpy = vi
      .spyOn(logger, "error")
      .mockImplementation(() => undefined);
    vi.mocked(findSoftDeletedPayslipObjects)
      .mockResolvedValueOnce([
        { id: "payslip-1", r2ObjectKey: "private/one.pdf" },
        { id: "payslip-2", r2ObjectKey: "private/two.pdf" },
        { id: "payslip-3", r2ObjectKey: "private/three.pdf" },
      ])
      .mockResolvedValueOnce([]);
    vi.mocked(deletePrivateObject)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce({ name: "NoSuchKey" })
      .mockRejectedValueOnce({ name: "AccessDenied" });

    await expect(
      retrySoftDeletedPayslipObjectDeletes("maintenance-request"),
    ).resolves.toEqual({ attempted: 3, deleted: 1, failed: 1, missing: 1 });

    expect(deletePrivateObject).toHaveBeenCalledTimes(3);
    expect(findSoftDeletedPayslipObjects).toHaveBeenNthCalledWith(1, {
      skip: 0,
      take: 100,
    });
    expect(findSoftDeletedPayslipObjects).toHaveBeenNthCalledWith(2, {
      skip: 3,
      take: 100,
    });
    const loggedPayload = JSON.stringify(logSpy.mock.calls);
    expect(loggedPayload).not.toContain("private/one.pdf");
    expect(loggedPayload).not.toContain("private/two.pdf");
    expect(loggedPayload).not.toContain("private/three.pdf");
    expect(loggedPayload).toContain("access_denied");
    expect(loggedPayload).toContain("payslip-3");
    logSpy.mockRestore();
  });
});
