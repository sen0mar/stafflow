import type { AuthContext } from "../core/auth/auth.types";
import { getRolePermissions } from "../core/auth/permissions";
import {
  canClockSelfAttendance,
  canReadAttendanceForEmployee,
  canUpdateAnyAttendance,
  getSelfAttendanceEmployeeId,
} from "./attendance/attendance.policy";
import {
  canCreateEmployees,
  canDeleteEmployees,
  canReadEmployee,
  canUpdateEmployee,
  requireSelfEmployeeId,
} from "./employees/employees.policy";
import {
  canApproveAnyLeave,
  canCreateLeaveForSelf,
  canReadLeaveForEmployee,
  canRejectAnyLeave,
  getSelfLeaveEmployeeId,
} from "./leave/leave.policy";
import {
  canDeletePayslips,
  canReadPayslipForEmployee,
  canUploadPayslips,
  getSelfPayslipEmployeeId,
} from "./payslips/payslips.policy";

const authContext = ({
  employeeId,
  role,
}: {
  employeeId: string | null;
  role: "ADMIN" | "EMPLOYEE";
}): AuthContext => ({
  employeeId,
  permissions: getRolePermissions(role),
  role,
  sessionId: `${role}-session`,
  user: {
    email: `${role.toLowerCase()}@example.com`,
    employee: employeeId
      ? { firstName: "Test", id: employeeId, lastName: "User" }
      : null,
    employeeId,
    id: `${role}-user`,
    role,
    status: "ACTIVE",
  },
  userId: `${role}-user`,
});

describe("resource policies", () => {
  const admin = authContext({ employeeId: null, role: "ADMIN" });
  const employee = authContext({ employeeId: "employee-1", role: "EMPLOYEE" });

  it("enforces employee self ownership", () => {
    expect(requireSelfEmployeeId(employee)).toBe("employee-1");
    expect(canReadEmployee(employee, "employee-1")).toBe(true);
    expect(canUpdateEmployee(employee, "employee-1")).toBe(true);
    expect(canReadEmployee(employee, "employee-2")).toBe(false);
    expect(canUpdateEmployee(employee, "employee-2")).toBe(false);
    expect(canCreateEmployees(employee)).toBe(false);
    expect(canDeleteEmployees(employee)).toBe(false);
  });

  it("enforces attendance self ownership and admin management", () => {
    expect(getSelfAttendanceEmployeeId(employee)).toBe("employee-1");
    expect(canReadAttendanceForEmployee(employee, "employee-1")).toBe(true);
    expect(canReadAttendanceForEmployee(employee, "employee-2")).toBe(false);
    expect(canClockSelfAttendance(employee, "employee-1")).toBe(true);
    expect(canClockSelfAttendance(employee, "employee-2")).toBe(false);
    expect(canUpdateAnyAttendance(employee)).toBe(false);
    expect(canUpdateAnyAttendance(admin)).toBe(true);
  });

  it("enforces leave self ownership and admin review rights", () => {
    expect(getSelfLeaveEmployeeId(employee)).toBe("employee-1");
    expect(canCreateLeaveForSelf(employee, "employee-1")).toBe(true);
    expect(canCreateLeaveForSelf(employee, "employee-2")).toBe(false);
    expect(canReadLeaveForEmployee(employee, "employee-1")).toBe(true);
    expect(canReadLeaveForEmployee(employee, "employee-2")).toBe(false);
    expect(canApproveAnyLeave(employee)).toBe(false);
    expect(canRejectAnyLeave(employee)).toBe(false);
    expect(canApproveAnyLeave(admin)).toBe(true);
    expect(canRejectAnyLeave(admin)).toBe(true);
  });

  it("enforces payslip ownership and admin upload/delete rights", () => {
    expect(getSelfPayslipEmployeeId(employee)).toBe("employee-1");
    expect(canReadPayslipForEmployee(employee, "employee-1")).toBe(true);
    expect(canReadPayslipForEmployee(employee, "employee-2")).toBe(false);
    expect(canUploadPayslips(employee)).toBe(false);
    expect(canDeletePayslips(employee)).toBe(false);
    expect(canUploadPayslips(admin)).toBe(true);
    expect(canDeletePayslips(admin)).toBe(true);
  });

  it("requires an employee profile for self-service policies", () => {
    const noProfile = authContext({ employeeId: null, role: "EMPLOYEE" });

    expect(() => requireSelfEmployeeId(noProfile)).toThrow();
    expect(() => getSelfAttendanceEmployeeId(noProfile)).toThrow();
    expect(() => getSelfLeaveEmployeeId(noProfile)).toThrow();
    expect(() => getSelfPayslipEmployeeId(noProfile)).toThrow();
  });
});
