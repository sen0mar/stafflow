import type { UserRole, UserStatus } from "@prisma/client";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  employeeId: string | null;
  employee: PublicAuthUser["employee"];
}

export interface AuthContext {
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
