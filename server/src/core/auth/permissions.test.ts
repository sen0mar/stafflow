import type { NextFunction, Request, Response } from "express";

import { AppError } from "../errors/app-error";
import {
  getRolePermissions,
  hasPermission,
  requirePermission,
} from "./permissions";

describe("permissions", () => {
  it("keeps admin-only permissions away from employees", () => {
    const employeePermissions = getRolePermissions("EMPLOYEE");

    expect(hasPermission(employeePermissions, "payslips:read:self")).toBe(true);
    expect(hasPermission(employeePermissions, "employees:read:any")).toBe(
      false,
    );
    expect(hasPermission(employeePermissions, "payslips:upload")).toBe(false);
  });

  it("grants admins broad management permissions", () => {
    const adminPermissions = getRolePermissions("ADMIN");

    expect(hasPermission(adminPermissions, "employees:create")).toBe(true);
    expect(hasPermission(adminPermissions, "leave:approve:any")).toBe(true);
    expect(hasPermission(adminPermissions, "auditLogs:read")).toBe(true);
  });

  it("rejects missing auth in requirePermission", () => {
    const middleware = requirePermission("employees:create");
    const next: NextFunction = vi.fn();

    expect(() => middleware({} as Request, {} as Response, next)).toThrowError(
      AppError,
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects authenticated users without the required permission", () => {
    const middleware = requirePermission("employees:create");
    const next: NextFunction = vi.fn();

    expect(() =>
      middleware(
        {
          auth: {
            employeeId: "employee-1",
            permissions: getRolePermissions("EMPLOYEE"),
            role: "EMPLOYEE",
            sessionId: "session-1",
            user: {
              email: "employee@example.com",
              employee: null,
              employeeId: "employee-1",
              id: "user-1",
              role: "EMPLOYEE",
              status: "ACTIVE",
            },
            userId: "user-1",
          },
        } as Request,
        {} as Response,
        next,
      ),
    ).toThrowError(AppError);
    expect(next).not.toHaveBeenCalled();
  });
});
