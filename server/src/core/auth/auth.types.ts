import type { UserRole, UserStatus } from "@prisma/client";

export type Permission =
  | "audit-logs:read"
  | "attendance:manage"
  | "attendance:self"
  | "departments:manage"
  | "employees:manage"
  | "leave:manage"
  | "leave:self"
  | "payslips:manage"
  | "payslips:self"
  | "settings:manage";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  employeeId: string | null;
  employee: PublicAuthUser["employee"];
}

export interface AuthContext {
  userId: string;
  employeeId: string | null;
  role: UserRole;
  permissions: Permission[];
  sessionId: string;
  user: AuthUser;
}

export interface PublicAuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}
