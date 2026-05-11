import type { RequestHandler } from "express";

import type { ApiSuccess } from "../../core/types/api-response";
import { updateUserAccountSchema } from "./users.schema";
import { updateExistingUserAccount } from "./users.service";

const getAuditContext = (request: Parameters<RequestHandler>[0]) => ({
  actorUserId: request.auth?.userId ?? null,
  ipAddress: request.ip,
  userAgent: request.get("user-agent"),
});

export const updateUserAccountController: RequestHandler = async (
  request,
  response,
) => {
  const { body, params } = updateUserAccountSchema.parse({
    body: request.body,
    params: request.params,
  });
  const user = await updateExistingUserAccount(
    params.id,
    body,
    getAuditContext(request),
  );
  const responseBody: ApiSuccess<typeof user> = {
    data: user,
  };

  response.status(200).json(responseBody);
};
