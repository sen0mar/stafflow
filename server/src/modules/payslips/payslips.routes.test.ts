import express, { type ErrorRequestHandler } from "express";
import request from "supertest";

import { AppError } from "../../core/errors/app-error";
import { uploadPayslipFile } from "./payslips.routes";

vi.mock("../../config/env", () => ({
  env: {
    PAYSLIP_MAX_UPLOAD_BYTES: 16,
  },
}));

const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  response.status(500).json({ error: { code: "INTERNAL_ERROR" } });
};

describe("payslip upload middleware", () => {
  it("rejects oversized files before the request reaches storage processing", async () => {
    const app = express();

    app.post("/payslips", uploadPayslipFile, (_request, response) => {
      response.status(201).end();
    });
    app.use(errorHandler);

    await request(app)
      .post("/payslips")
      .attach("file", Buffer.alloc(17), {
        contentType: "application/pdf",
        filename: "oversized.pdf",
      })
      .expect(413)
      .expect(({ body }) => {
        expect(body.error.code).toBe("PAYSLIP_FILE_TOO_LARGE");
      });
  });
});
