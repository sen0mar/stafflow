import type { RequestHandler } from "express";

import type { ApiSuccess } from "../../core/types/api-response";
import {
  createEmployeeSchema,
  disableEmployeeSchema,
  employeeIdSchema,
  listEmployeesSchema,
  updateEmployeeSchema,
  updateEmployeeStatusSchema,
  updateSelfProfileSchema,
} from "./employees.schema";
import {
  createNewEmployee,
  disableExistingEmployee,
  getEmployee,
  getEmployees,
  getSelfEmployee,
  updateEmployeeStatuses,
  updateExistingEmployee,
  updateSelfProfile,
} from "./employees.service";

const getAuditContext = (request: Parameters<RequestHandler>[0]) => ({
  actorUserId: request.auth?.userId ?? null,
  ipAddress: request.ip,
  userAgent: request.get("user-agent"),
});

export const listEmployeesController: RequestHandler = async (
  request,
  response,
) => {
  const { query } = listEmployeesSchema.parse({ query: request.query });
  const employees = await getEmployees(query);

  response.status(200).json(employees);
};

export const getEmployeeController: RequestHandler = async (
  request,
  response,
) => {
  const { params } = employeeIdSchema.parse({ params: request.params });
  const employee = await getEmployee(params.id);
  const responseBody: ApiSuccess<typeof employee> = {
    data: employee,
  };

  response.status(200).json(responseBody);
};

export const getSelfEmployeeController: RequestHandler = async (
  request,
  response,
) => {
  const employee = await getSelfEmployee(request.auth!);
  const responseBody: ApiSuccess<typeof employee> = {
    data: employee,
  };

  response.status(200).json(responseBody);
};

export const createEmployeeController: RequestHandler = async (
  request,
  response,
) => {
  const { body } = createEmployeeSchema.parse({ body: request.body });
  const result = await createNewEmployee(body, getAuditContext(request));
  const responseBody: ApiSuccess<typeof result> = {
    data: result,
  };

  response.status(201).json(responseBody);
};

export const updateEmployeeController: RequestHandler = async (
  request,
  response,
) => {
  const { body, params } = updateEmployeeSchema.parse({
    body: request.body,
    params: request.params,
  });
  const employee = await updateExistingEmployee(
    params.id,
    body,
    getAuditContext(request),
  );
  const responseBody: ApiSuccess<typeof employee> = {
    data: employee,
  };

  response.status(200).json(responseBody);
};

export const updateEmployeeStatusController: RequestHandler = async (
  request,
  response,
) => {
  const { body, params } = updateEmployeeStatusSchema.parse({
    body: request.body,
    params: request.params,
  });
  const employee = await updateEmployeeStatuses(
    params.id,
    body,
    getAuditContext(request),
  );
  const responseBody: ApiSuccess<typeof employee> = {
    data: employee,
  };

  response.status(200).json(responseBody);
};

export const disableEmployeeController: RequestHandler = async (
  request,
  response,
) => {
  const { body, params } = disableEmployeeSchema.parse({
    body: request.body,
    params: request.params,
  });
  const employee = await disableExistingEmployee(
    params.id,
    body,
    getAuditContext(request),
  );
  const responseBody: ApiSuccess<typeof employee> = {
    data: employee,
  };

  response.status(200).json(responseBody);
};

export const updateSelfProfileController: RequestHandler = async (
  request,
  response,
) => {
  const { body } = updateSelfProfileSchema.parse({ body: request.body });
  const employee = await updateSelfProfile(
    request.auth!,
    body,
    getAuditContext(request),
  );
  const responseBody: ApiSuccess<typeof employee> = {
    data: employee,
  };

  response.status(200).json(responseBody);
};
