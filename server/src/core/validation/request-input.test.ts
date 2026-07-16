import {
  attendanceIdSchema,
  listAttendanceSchema,
} from "../../modules/attendance/attendance.schema";
import {
  auditLogIdSchema,
  listAuditLogsSchema,
} from "../../modules/audit-logs/audit-logs.schema";
import {
  acceptInvitationSchema,
  loginSchema,
} from "../../modules/auth/auth.schema";
import {
  departmentIdSchema,
  listDepartmentsSchema,
} from "../../modules/departments/departments.schema";
import {
  createEmployeeSchema,
  employeeIdSchema,
  listEmployeesSchema,
} from "../../modules/employees/employees.schema";
import {
  createLeaveRequestSchema,
  leaveIdSchema,
  listLeaveRequestsSchema,
  listLeaveTypesSchema,
} from "../../modules/leave/leave.schema";
import {
  createPayslipSchema,
  listPayslipsSchema,
  payslipIdSchema,
} from "../../modules/payslips/payslips.schema";
import { requestInputLimits } from "./request-input";

describe("shared scalar request limits", () => {
  const oversizedId = "i".repeat(requestInputLimits.idCharacters + 1);
  const oversizedSearch = "s".repeat(requestInputLimits.searchCharacters + 1);

  it.each([
    [
      "attendance route ID",
      () => attendanceIdSchema.parse({ params: { id: oversizedId } }),
    ],
    [
      "attendance employee filter",
      () => listAttendanceSchema.parse({ query: { employeeId: oversizedId } }),
    ],
    [
      "attendance department filter",
      () =>
        listAttendanceSchema.parse({ query: { departmentId: oversizedId } }),
    ],
    [
      "audit-log route ID",
      () => auditLogIdSchema.parse({ params: { id: oversizedId } }),
    ],
    [
      "audit actor filter",
      () => listAuditLogsSchema.parse({ query: { actorUserId: oversizedId } }),
    ],
    [
      "audit entity filter",
      () => listAuditLogsSchema.parse({ query: { entityId: oversizedId } }),
    ],
    [
      "department route ID",
      () => departmentIdSchema.parse({ params: { id: oversizedId } }),
    ],
    [
      "employee route ID",
      () => employeeIdSchema.parse({ params: { id: oversizedId } }),
    ],
    [
      "employee department filter",
      () => listEmployeesSchema.parse({ query: { departmentId: oversizedId } }),
    ],
    [
      "employee department body",
      () =>
        createEmployeeSchema.parse({
          body: {
            departmentId: oversizedId,
            email: "person@example.com",
            employeeCode: "E-1",
            firstName: "Pat",
            lastName: "Lee",
          },
        }),
    ],
    [
      "leave route ID",
      () => leaveIdSchema.parse({ params: { id: oversizedId } }),
    ],
    [
      "leave employee filter",
      () =>
        listLeaveRequestsSchema.parse({ query: { employeeId: oversizedId } }),
    ],
    [
      "leave-type filter",
      () =>
        listLeaveRequestsSchema.parse({ query: { leaveTypeId: oversizedId } }),
    ],
    [
      "leave-type body ID",
      () =>
        createLeaveRequestSchema.parse({
          body: {
            endDate: "2026-07-17",
            leaveTypeId: oversizedId,
            startDate: "2026-07-16",
          },
        }),
    ],
    [
      "payslip route ID",
      () => payslipIdSchema.parse({ params: { id: oversizedId } }),
    ],
    [
      "payslip employee filter",
      () => listPayslipsSchema.parse({ query: { employeeId: oversizedId } }),
    ],
    [
      "payslip employee body ID",
      () =>
        createPayslipSchema.parse({
          body: { employeeId: oversizedId, month: 7, year: 2026 },
        }),
    ],
  ])("rejects an oversized %s", (_label, parseInput) => {
    expect(parseInput).toThrow();
  });

  it.each([
    [
      "department search",
      () => listDepartmentsSchema.parse({ query: { search: oversizedSearch } }),
    ],
    [
      "employee search",
      () => listEmployeesSchema.parse({ query: { search: oversizedSearch } }),
    ],
    [
      "leave-type search",
      () => listLeaveTypesSchema.parse({ query: { search: oversizedSearch } }),
    ],
    [
      "payslip search",
      () => listPayslipsSchema.parse({ query: { search: oversizedSearch } }),
    ],
  ])("rejects an oversized %s", (_label, parseInput) => {
    expect(parseInput).toThrow();
  });

  it("rejects oversized email inputs at both public-auth and employee boundaries", () => {
    const email = `${"a".repeat(requestInputLimits.emailCharacters)}@example.com`;

    expect(() =>
      loginSchema.parse({ body: { email, password: "password" } }),
    ).toThrow();
    expect(() =>
      createEmployeeSchema.parse({
        body: {
          email,
          employeeCode: "E-1",
          firstName: "Pat",
          lastName: "Lee",
        },
      }),
    ).toThrow();
  });

  it("rejects oversized public invitation tokens", () => {
    expect(() =>
      acceptInvitationSchema.parse({
        body: {
          password: "valid-password",
          token: "t".repeat(requestInputLimits.publicTokenCharacters + 1),
        },
      }),
    ).toThrow();
  });

  it("preserves valid values at the shared maximums", () => {
    const id = "i".repeat(requestInputLimits.idCharacters);
    const search = "s".repeat(requestInputLimits.searchCharacters);
    const token = "t".repeat(requestInputLimits.publicTokenCharacters);

    expect(employeeIdSchema.parse({ params: { id } }).params.id).toBe(id);
    expect(listEmployeesSchema.parse({ query: { search } }).query.search).toBe(
      search,
    );
    expect(
      acceptInvitationSchema.parse({ body: { password: "password", token } })
        .body.token,
    ).toBe(token);
  });
});
