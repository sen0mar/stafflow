import type { RequestHandler } from "express";

import type { ApiSuccess } from "../../core/types/api-response";
import {
  createDepartmentSchema,
  departmentIdSchema,
  listDepartmentsSchema,
  updateDepartmentSchema,
} from "./departments.schema";
import {
  createNewDepartment,
  deleteExistingDepartment,
  getDepartment,
  getDepartments,
  updateExistingDepartment,
} from "./departments.service";

const getAuditContext = (request: Parameters<RequestHandler>[0]) => ({
  actorUserId: request.auth?.userId ?? null,
  ipAddress: request.ip,
  userAgent: request.get("user-agent"),
});

export const listDepartmentsController: RequestHandler = async (
  request,
  response,
) => {
  const { query } = listDepartmentsSchema.parse({ query: request.query });
  const departments = await getDepartments(query);

  response.status(200).json(departments);
};

export const getDepartmentController: RequestHandler = async (
  request,
  response,
) => {
  const { params } = departmentIdSchema.parse({ params: request.params });
  const department = await getDepartment(params.id);
  const responseBody: ApiSuccess<typeof department> = {
    data: department,
  };

  response.status(200).json(responseBody);
};

export const createDepartmentController: RequestHandler = async (
  request,
  response,
) => {
  const { body } = createDepartmentSchema.parse({ body: request.body });
  const department = await createNewDepartment(body, getAuditContext(request));
  const responseBody: ApiSuccess<typeof department> = {
    data: department,
  };

  response.status(201).json(responseBody);
};

export const updateDepartmentController: RequestHandler = async (
  request,
  response,
) => {
  const { body, params } = updateDepartmentSchema.parse({
    body: request.body,
    params: request.params,
  });
  const department = await updateExistingDepartment(
    params.id,
    body,
    getAuditContext(request),
  );
  const responseBody: ApiSuccess<typeof department> = {
    data: department,
  };

  response.status(200).json(responseBody);
};

export const deleteDepartmentController: RequestHandler = async (
  request,
  response,
) => {
  const { params } = departmentIdSchema.parse({ params: request.params });
  const department = await deleteExistingDepartment(
    params.id,
    getAuditContext(request),
  );
  const responseBody: ApiSuccess<typeof department> = {
    data: department,
  };

  response.status(200).json(responseBody);
};
