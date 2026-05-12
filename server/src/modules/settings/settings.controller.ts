import type { RequestHandler } from "express";

import type { ApiSuccess } from "../../core/types/api-response";
import {
  updateAttendanceSettingsSchema,
  updateCompanySettingsSchema,
  updateLeaveSettingsSchema,
} from "./settings.schema";
import {
  getAttendanceSettings,
  getCompanySettings,
  getLeaveSettings,
  updateAttendanceSettings,
  updateCompanySettings,
  updateLeaveSettings,
} from "./settings.service";

const getAuditContext = (request: Parameters<RequestHandler>[0]) => ({
  actorUserId: request.auth?.userId ?? null,
  ipAddress: request.ip,
  userAgent: request.get("user-agent"),
});

export const getCompanySettingsController: RequestHandler = async (
  _request,
  response,
) => {
  const settings = await getCompanySettings();
  const responseBody: ApiSuccess<typeof settings> = { data: settings };

  response.status(200).json(responseBody);
};

export const updateCompanySettingsController: RequestHandler = async (
  request,
  response,
) => {
  const { body } = updateCompanySettingsSchema.parse({ body: request.body });
  const settings = await updateCompanySettings(body, getAuditContext(request));
  const responseBody: ApiSuccess<typeof settings> = { data: settings };

  response.status(200).json(responseBody);
};

export const getAttendanceSettingsController: RequestHandler = async (
  _request,
  response,
) => {
  const settings = await getAttendanceSettings();
  const responseBody: ApiSuccess<typeof settings> = { data: settings };

  response.status(200).json(responseBody);
};

export const updateAttendanceSettingsController: RequestHandler = async (
  request,
  response,
) => {
  const { body } = updateAttendanceSettingsSchema.parse({
    body: request.body,
  });
  const settings = await updateAttendanceSettings(
    body,
    getAuditContext(request),
  );
  const responseBody: ApiSuccess<typeof settings> = { data: settings };

  response.status(200).json(responseBody);
};

export const getLeaveSettingsController: RequestHandler = async (
  _request,
  response,
) => {
  const settings = await getLeaveSettings();
  const responseBody: ApiSuccess<typeof settings> = { data: settings };

  response.status(200).json(responseBody);
};

export const updateLeaveSettingsController: RequestHandler = async (
  request,
  response,
) => {
  const { body } = updateLeaveSettingsSchema.parse({ body: request.body });
  const settings = await updateLeaveSettings(body, getAuditContext(request));
  const responseBody: ApiSuccess<typeof settings> = { data: settings };

  response.status(200).json(responseBody);
};
