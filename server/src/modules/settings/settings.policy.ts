import type { AuthContext } from "../../core/auth/auth.types";
import { hasPermission } from "../../core/auth/permissions";

export const canManageSettings = (auth: AuthContext): boolean =>
  hasPermission(auth.permissions, "settings:manage");
