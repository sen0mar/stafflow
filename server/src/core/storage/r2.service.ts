import { randomUUID } from "node:crypto";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { payslipPdfMimeType } from "./file-validation";
import { getR2Client, getR2Config } from "./r2.client";

const signedUrlTtlSeconds = 60 * 5;

export const createPayslipObjectKey = ({
  employeeId,
  month,
  year,
}: {
  employeeId: string;
  month: number;
  year: number;
}) => {
  const paddedMonth = String(month).padStart(2, "0");

  return `payslips/${employeeId}/${year}-${paddedMonth}/${randomUUID()}.pdf`;
};

export const uploadPrivatePayslipPdf = async ({
  body,
  key,
}: {
  body: Buffer;
  key: string;
}) => {
  const r2Config = getR2Config();
  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Body: body,
      Bucket: r2Config.bucketName,
      ContentType: payslipPdfMimeType,
      Key: key,
    }),
  );
};

export const deletePrivateObject = async (key: string) => {
  const r2Config = getR2Config();
  const client = getR2Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
    }),
  );
};

export const createPrivateDownloadUrl = async (key: string) => {
  const r2Config = getR2Config();
  const client = getR2Client();
  const expiresAt = new Date(Date.now() + signedUrlTtlSeconds * 1000);
  const url = await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
    }),
    { expiresIn: signedUrlTtlSeconds },
  );

  return {
    expiresAt,
    url,
  };
};
