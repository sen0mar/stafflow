// A small self-contained PDF writer for the fixed demo layout. No payroll engine.
export const samplePayslipPdf = (
  name: string,
  code: string,
  year: number,
  month: number,
) => {
  const lines = [
    "STAFFLOW | DEMO PAYSLIP",
    "FICTIONAL SAMPLE - NOT A REAL PAYROLL DOCUMENT",
    "",
    "Stafflow Demo Company",
    `Employee: ${name}`,
    `Employee code: ${code}`,
    `Pay period: ${year}-${String(month).padStart(2, "0")}`,
    "Currency: USD",
    "",
    "EARNINGS",
    "Base salary                         5,000.00",
    "Illustrative allowance                200.00",
    "Gross pay                           5,200.00",
    "",
    "DEDUCTIONS",
    "Illustrative deductions             1,100.00",
    "",
    "NET PAY                             4,100.00",
    "",
    "All names and amounts are fictional demo data.",
    "Amounts are illustrative, not tax or payroll calculations.",
  ];
  const escape = (value: string) =>
    value.replace(/[^\x20-\x7e]/g, "?").replace(/[\\()]/g, "\\$&");
  const stream = `BT /F1 12 Tf 50 790 Td 23 TL\n${lines.map((line, index) => `${index ? "T* " : ""}(${escape(line)}) Tj`).join("\n")}\nET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
};
