import type { RequestHandler } from "express";

import type { ApiSuccess } from "../../core/types/api-response";
import {
  createPayslipSchema,
  listPayslipsSchema,
  listSelfPayslipsSchema,
  payslipIdSchema,
} from "./payslips.schema";
import {
  deletePayslip,
  getPayslipDetail,
  getPayslipDownload,
  getPayslipList,
  getSelfPayslipList,
  uploadPayslip,
} from "./payslips.service";

const getAuditContext = (request: Parameters<RequestHandler>[0]) => ({
  actorUserId: request.auth?.userId ?? null,
  ipAddress: request.ip,
  userAgent: request.get("user-agent"),
});

export const listSelfPayslipsController: RequestHandler = async (
  request,
  response,
) => {
  const { query } = listSelfPayslipsSchema.parse({ query: request.query });
  const payslips = await getSelfPayslipList(request.auth!, query);
  const responseBody: ApiSuccess<typeof payslips> = { data: payslips };

  response.status(200).json(responseBody);
};

export const listPayslipsController: RequestHandler = async (
  request,
  response,
) => {
  const { query } = listPayslipsSchema.parse({ query: request.query });
  const payslips = await getPayslipList(query);
  const responseBody: ApiSuccess<typeof payslips> = { data: payslips };

  response.status(200).json(responseBody);
};

export const getPayslipController: RequestHandler = async (
  request,
  response,
) => {
  const { params } = payslipIdSchema.parse({ params: request.params });
  const payslip = await getPayslipDetail(request.auth!, params.id);
  const responseBody: ApiSuccess<typeof payslip> = { data: payslip };

  response.status(200).json(responseBody);
};

export const createPayslipController: RequestHandler = async (
  request,
  response,
) => {
  const { body } = createPayslipSchema.parse({ body: request.body });
  const payslip = await uploadPayslip({
    auditContext: getAuditContext(request),
    file: request.file,
    input: body,
  });
  const responseBody: ApiSuccess<typeof payslip> = { data: payslip };

  response.status(201).json(responseBody);
};

export const deletePayslipController: RequestHandler = async (
  request,
  response,
) => {
  const { params } = payslipIdSchema.parse({ params: request.params });
  const payslip = await deletePayslip(
    request.auth!,
    params.id,
    getAuditContext(request),
  );
  const responseBody: ApiSuccess<typeof payslip> = { data: payslip };

  response.status(200).json(responseBody);
};

export const downloadPayslipController: RequestHandler = async (
  request,
  response,
) => {
  const { params } = payslipIdSchema.parse({ params: request.params });
  const download = await getPayslipDownload(request.auth!, params.id);
  const responseBody: ApiSuccess<typeof download> = { data: download };

  response.status(200).json(responseBody);
};
