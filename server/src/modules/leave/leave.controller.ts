import type { RequestHandler } from "express";

import type { ApiSuccess } from "../../core/types/api-response";
import {
  createLeaveRequestSchema,
  createLeaveTypeSchema,
  leaveIdSchema,
  listLeaveRequestsSchema,
  listLeaveTypesSchema,
  listSelfLeaveRequestsSchema,
  reviewLeaveRequestSchema,
  updateLeaveTypeSchema,
} from "./leave.schema";
import {
  approveLeaveRequest,
  cancelSelfLeaveRequest,
  createNewLeaveType,
  createSelfLeaveRequest,
  deleteExistingLeaveType,
  getLeaveRequestDetail,
  getLeaveRequestList,
  getLeaveTypes,
  getSelfLeaveRequests,
  rejectLeaveRequest,
  updateExistingLeaveType,
} from "./leave.service";

const getAuditContext = (request: Parameters<RequestHandler>[0]) => ({
  actorUserId: request.auth?.userId ?? null,
  ipAddress: request.ip,
  userAgent: request.get("user-agent"),
});

export const listLeaveTypesController: RequestHandler = async (
  request,
  response,
) => {
  const { query } = listLeaveTypesSchema.parse({ query: request.query });
  const leaveTypes = await getLeaveTypes(query);
  const responseBody: ApiSuccess<typeof leaveTypes> = { data: leaveTypes };

  response.status(200).json(responseBody);
};

export const createLeaveTypeController: RequestHandler = async (
  request,
  response,
) => {
  const { body } = createLeaveTypeSchema.parse({ body: request.body });
  const leaveType = await createNewLeaveType(body, getAuditContext(request));
  const responseBody: ApiSuccess<typeof leaveType> = { data: leaveType };

  response.status(201).json(responseBody);
};

export const updateLeaveTypeController: RequestHandler = async (
  request,
  response,
) => {
  const { body, params } = updateLeaveTypeSchema.parse({
    body: request.body,
    params: request.params,
  });
  const leaveType = await updateExistingLeaveType(
    params.id,
    body,
    getAuditContext(request),
  );
  const responseBody: ApiSuccess<typeof leaveType> = { data: leaveType };

  response.status(200).json(responseBody);
};

export const deleteLeaveTypeController: RequestHandler = async (
  request,
  response,
) => {
  const { params } = leaveIdSchema.parse({ params: request.params });
  const leaveType = await deleteExistingLeaveType(
    params.id,
    getAuditContext(request),
  );
  const responseBody: ApiSuccess<typeof leaveType> = { data: leaveType };

  response.status(200).json(responseBody);
};

export const listSelfLeaveRequestsController: RequestHandler = async (
  request,
  response,
) => {
  const { query } = listSelfLeaveRequestsSchema.parse({ query: request.query });
  const leaveRequests = await getSelfLeaveRequests(request.auth!, query);
  const responseBody: ApiSuccess<typeof leaveRequests> = { data: leaveRequests };

  response.status(200).json(responseBody);
};

export const createLeaveRequestController: RequestHandler = async (
  request,
  response,
) => {
  const { body } = createLeaveRequestSchema.parse({ body: request.body });
  const leaveRequest = await createSelfLeaveRequest(request.auth!, body);
  const responseBody: ApiSuccess<typeof leaveRequest> = { data: leaveRequest };

  response.status(201).json(responseBody);
};

export const cancelLeaveRequestController: RequestHandler = async (
  request,
  response,
) => {
  const { params } = leaveIdSchema.parse({ params: request.params });
  const leaveRequest = await cancelSelfLeaveRequest(request.auth!, params.id);
  const responseBody: ApiSuccess<typeof leaveRequest> = { data: leaveRequest };

  response.status(200).json(responseBody);
};

export const listLeaveRequestsController: RequestHandler = async (
  request,
  response,
) => {
  const { query } = listLeaveRequestsSchema.parse({ query: request.query });
  const leaveRequests = await getLeaveRequestList(query);
  const responseBody: ApiSuccess<typeof leaveRequests> = { data: leaveRequests };

  response.status(200).json(responseBody);
};

export const getLeaveRequestController: RequestHandler = async (
  request,
  response,
) => {
  const { params } = leaveIdSchema.parse({ params: request.params });
  const leaveRequest = await getLeaveRequestDetail(params.id);
  const responseBody: ApiSuccess<typeof leaveRequest> = { data: leaveRequest };

  response.status(200).json(responseBody);
};

export const approveLeaveRequestController: RequestHandler = async (
  request,
  response,
) => {
  const { body, params } = reviewLeaveRequestSchema.parse({
    body: request.body,
    params: request.params,
  });
  const leaveRequest = await approveLeaveRequest(
    params.id,
    body,
    getAuditContext(request),
  );
  const responseBody: ApiSuccess<typeof leaveRequest> = { data: leaveRequest };

  response.status(200).json(responseBody);
};

export const rejectLeaveRequestController: RequestHandler = async (
  request,
  response,
) => {
  const { body, params } = reviewLeaveRequestSchema.parse({
    body: request.body,
    params: request.params,
  });
  const leaveRequest = await rejectLeaveRequest(
    params.id,
    body,
    getAuditContext(request),
  );
  const responseBody: ApiSuccess<typeof leaveRequest> = { data: leaveRequest };

  response.status(200).json(responseBody);
};
