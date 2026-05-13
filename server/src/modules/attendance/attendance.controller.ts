import type { RequestHandler } from "express";

import type { ApiSuccess } from "../../core/types/api-response";
import {
  attendanceIdSchema,
  listAttendanceSchema,
  listSelfAttendanceSchema,
  updateAttendanceSchema,
} from "./attendance.schema";
import {
  clockInSelf,
  clockOutSelf,
  correctAttendance,
  getAttendanceDetail,
  getAttendanceList,
  getSelfAttendanceHistory,
  getSelfTodayAttendance,
} from "./attendance.service";

const getAuditContext = (request: Parameters<RequestHandler>[0]) => ({
  actorUserId: request.auth?.userId ?? null,
  ipAddress: request.ip,
  userAgent: request.get("user-agent"),
});

export const getSelfTodayAttendanceController: RequestHandler = async (
  request,
  response,
) => {
  const attendance = await getSelfTodayAttendance(request.auth!);
  const responseBody: ApiSuccess<typeof attendance> = {
    data: attendance,
  };

  response.status(200).json(responseBody);
};

export const listSelfAttendanceController: RequestHandler = async (
  request,
  response,
) => {
  const { query } = listSelfAttendanceSchema.parse({ query: request.query });
  const attendance = await getSelfAttendanceHistory(request.auth!, query);

  response.status(200).json(attendance);
};

export const clockInController: RequestHandler = async (request, response) => {
  const attendance = await clockInSelf(request.auth!);
  const responseBody: ApiSuccess<typeof attendance> = {
    data: attendance,
  };

  response.status(201).json(responseBody);
};

export const clockOutController: RequestHandler = async (request, response) => {
  const attendance = await clockOutSelf(request.auth!);
  const responseBody: ApiSuccess<typeof attendance> = {
    data: attendance,
  };

  response.status(200).json(responseBody);
};

export const listAttendanceController: RequestHandler = async (
  request,
  response,
) => {
  const { query } = listAttendanceSchema.parse({ query: request.query });
  const attendance = await getAttendanceList(query);

  response.status(200).json(attendance);
};

export const getAttendanceController: RequestHandler = async (
  request,
  response,
) => {
  const { params } = attendanceIdSchema.parse({ params: request.params });
  const attendance = await getAttendanceDetail(params.id);
  const responseBody: ApiSuccess<typeof attendance> = {
    data: attendance,
  };

  response.status(200).json(responseBody);
};

export const updateAttendanceController: RequestHandler = async (
  request,
  response,
) => {
  const { body, params } = updateAttendanceSchema.parse({
    body: request.body,
    params: request.params,
  });
  const attendance = await correctAttendance(
    params.id,
    body,
    getAuditContext(request),
  );
  const responseBody: ApiSuccess<typeof attendance> = {
    data: attendance,
  };

  response.status(200).json(responseBody);
};
