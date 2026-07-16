import type { AuthContext } from "../core/auth/auth.types";
import { getRolePermissions } from "../core/auth/permissions";
import { getSelfAttendanceEmployeeId } from "./attendance/attendance.policy";
import { requireSelfEmployeeId } from "./employees/employees.policy";
import { getSelfLeaveEmployeeId } from "./leave/leave.policy";
import { getSelfPayslipEmployeeId } from "./payslips/payslips.policy";

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
  const employee = authContext({ employeeId: "employee-1", role: "EMPLOYEE" });

  it("derives self-service employee IDs from authentication", () => {
    expect(requireSelfEmployeeId(employee)).toBe("employee-1");
    expect(getSelfAttendanceEmployeeId(employee)).toBe("employee-1");
    expect(getSelfLeaveEmployeeId(employee)).toBe("employee-1");
    expect(getSelfPayslipEmployeeId(employee)).toBe("employee-1");
  });

  it("requires an employee profile for self-service policies", () => {
    const noProfile = authContext({ employeeId: null, role: "EMPLOYEE" });

    expect(() => requireSelfEmployeeId(noProfile)).toThrow();
    expect(() => getSelfAttendanceEmployeeId(noProfile)).toThrow();
    expect(() => getSelfLeaveEmployeeId(noProfile)).toThrow();
    expect(() => getSelfPayslipEmployeeId(noProfile)).toThrow();
  });
});
