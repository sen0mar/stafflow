import type { RequestHandler } from "express";

import type { ApiSuccess } from "../../core/types/api-response";
import {
  getAdminDashboardSummary,
  getEmployeeDashboardSummary,
} from "./dashboard.service";

export const adminDashboardSummaryController: RequestHandler = async (
  _request,
  response,
) => {
  const summary = await getAdminDashboardSummary();
  const responseBody: ApiSuccess<typeof summary> = {
    data: summary,
  };

  response.status(200).json(responseBody);
};

export const employeeDashboardSummaryController: RequestHandler = async (
  request,
  response,
) => {
  const summary = await getEmployeeDashboardSummary(
    request.auth?.employeeId ?? null,
  );
  const responseBody: ApiSuccess<typeof summary> = {
    data: summary,
  };

  response.status(200).json(responseBody);
};
