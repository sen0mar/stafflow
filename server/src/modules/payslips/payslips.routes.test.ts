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
  const createApp = () => {
    const app = express();

    app.post("/payslips", uploadPayslipFile, (_request, response) => {
      response.status(201).end();
    });
    app.use(errorHandler);

    return app;
  };

  it("rejects oversized files before the request reaches storage processing", async () => {
    const app = createApp();

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

  it.each([
    {
      buildRequest: (app: express.Express) =>
        request(app)
          .post("/payslips")
          .field("employeeId", "employee-1")
          .field("year", "2026")
          .field("month", "5")
          .field("extra", "unexpected"),
      name: "too many fields",
    },
    {
      buildRequest: (app: express.Express) =>
        request(app).post("/payslips").field("employeeId", "x".repeat(129)),
      name: "an oversized field value",
    },
    {
      buildRequest: (app: express.Express) =>
        request(app).post("/payslips").field("x".repeat(33), "value"),
      name: "an oversized field name",
    },
    {
      buildRequest: (app: express.Express) =>
        request(app)
          .post("/payslips")
          .field("employeeId", "employee-1")
          .field("year", "2026")
          .field("month", "5")
          .attach("file", Buffer.from("%PDF"), {
            contentType: "application/pdf",
            filename: "first.pdf",
          })
          .attach("second", Buffer.from("%PDF"), {
            contentType: "application/pdf",
            filename: "second.pdf",
          }),
      name: "too many multipart parts",
    },
  ])("rejects $name", async ({ buildRequest }) => {
    await buildRequest(createApp())
      .expect(422)
      .expect(({ body }) => {
        expect(body.error.code).toBe("PAYSLIP_UPLOAD_INVALID");
      });
  });
});
