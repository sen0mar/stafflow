import type { UserRole, UserStatus } from "@prisma/client";

import type { Permission } from "./permissions";

export type { Permission };

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
