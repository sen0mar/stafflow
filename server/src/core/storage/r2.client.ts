import { S3Client } from "@aws-sdk/client-s3";

import { env } from "../../config/env";
import { AppError } from "../errors/app-error";

const getRequiredR2Config = () => {
  const missing = [
    ["R2_ACCOUNT_ID", env.R2_ACCOUNT_ID],
    ["R2_ACCESS_KEY_ID", env.R2_ACCESS_KEY_ID],
    ["R2_SECRET_ACCESS_KEY", env.R2_SECRET_ACCESS_KEY],
    ["R2_BUCKET_NAME", env.R2_BUCKET_NAME],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new AppError({
      code: "R2_STORAGE_NOT_CONFIGURED",
      details: { missing },
      message: "File storage is not configured.",
      statusCode: 500,
    });
  }

  return {
    accessKeyId: env.R2_ACCESS_KEY_ID!,
    accountId: env.R2_ACCOUNT_ID!,
    bucketName: env.R2_BUCKET_NAME!,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
  };
};

export const getR2Config = () => getRequiredR2Config();

export const createR2Client = () => {
  const config = getRequiredR2Config();

  return new S3Client({
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    region: "auto",
  });
};
