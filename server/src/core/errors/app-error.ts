export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: unknown;

  public constructor({
    code,
    details,
    message,
    statusCode,
  }: {
    code?: string;
    details?: unknown;
    message: string;
    statusCode: number;
  }) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
