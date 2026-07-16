export type StorageErrorClassification =
  | "access_denied"
  | "not_found"
  | "rate_limited"
  | "timeout"
  | "unavailable"
  | "unknown";

interface StorageErrorShape {
  $metadata?: {
    httpStatusCode?: number;
  };
  code?: string;
  name?: string;
}

const getStorageErrorShape = (error: unknown): StorageErrorShape =>
  typeof error === "object" && error !== null
    ? (error as StorageErrorShape)
    : {};

export const classifyStorageError = (
  error: unknown,
): StorageErrorClassification => {
  const shape = getStorageErrorShape(error);
  const identifier = shape.name ?? shape.code;
  const statusCode = shape.$metadata?.httpStatusCode;

  if (
    statusCode === 404 ||
    identifier === "NoSuchKey" ||
    identifier === "NotFound"
  ) {
    return "not_found";
  }

  if (
    statusCode === 401 ||
    statusCode === 403 ||
    identifier === "AccessDenied"
  ) {
    return "access_denied";
  }

  if (
    statusCode === 429 ||
    identifier === "SlowDown" ||
    identifier === "Throttling"
  ) {
    return "rate_limited";
  }

  if (
    identifier === "AbortError" ||
    identifier === "RequestTimeout" ||
    identifier === "TimeoutError"
  ) {
    return "timeout";
  }

  if (statusCode !== undefined && statusCode >= 500) {
    return "unavailable";
  }

  return "unknown";
};

export const isMissingStorageObjectError = (error: unknown) =>
  classifyStorageError(error) === "not_found";
