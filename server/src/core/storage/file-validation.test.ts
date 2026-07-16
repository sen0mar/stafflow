import {
  payslipDisplayFilenameMaxLength,
  sanitizePayslipDisplayFilename,
} from "./file-validation";

describe("sanitizePayslipDisplayFilename", () => {
  it("normalizes path separators, control characters, reserved characters, and extension casing", () => {
    expect(
      sanitizePayslipDisplayFilename(
        "../private\\pay\u0000 slip\u202E<May>|2026.PDF",
      ),
    ).toBe("pay slip_May__2026.pdf");
  });

  it("uses a deterministic fallback for an empty sanitized stem", () => {
    expect(sanitizePayslipDisplayFilename("\u0000.pdf")).toBe("payslip.pdf");
  });

  it("bounds Unicode display names while preserving the PDF extension", () => {
    const result = sanitizePayslipDisplayFilename(`${"é".repeat(200)}.pdf`);

    expect(Array.from(result)).toHaveLength(payslipDisplayFilenameMaxLength);
    expect(result.endsWith(".pdf")).toBe(true);
  });
});
