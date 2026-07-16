import { listAttendanceSchema } from "../../modules/attendance/attendance.schema";
import { createEmployeeSchema } from "../../modules/employees/employees.schema";
import { createLeaveRequestSchema } from "../../modules/leave/leave.schema";

describe("date-only API contracts", () => {
  it("accepts YYYY-MM-DD calendar fields", () => {
    expect(
      createEmployeeSchema.safeParse({
        body: {
          email: "date.contract@example.com",
          employeeCode: "DATE-001",
          firstName: "Date",
          hireDate: "2026-07-16",
          lastName: "Contract",
        },
      }).success,
    ).toBe(true);
    expect(
      createLeaveRequestSchema.safeParse({
        body: {
          endDate: "2026-07-18",
          leaveTypeId: "leave-type",
          startDate: "2026-07-16",
        },
      }).success,
    ).toBe(true);
    expect(
      listAttendanceSchema.safeParse({
        query: { from: "2026-07-16", to: "2026-07-18" },
      }).success,
    ).toBe(true);
  });

  it.each([
    [
      "employee hire date",
      createEmployeeSchema,
      {
        body: {
          email: "date.contract@example.com",
          employeeCode: "DATE-001",
          firstName: "Date",
          hireDate: "2026-07-16T00:00:00.000Z",
          lastName: "Contract",
        },
      },
    ],
    [
      "leave range",
      createLeaveRequestSchema,
      {
        body: {
          endDate: "2026-07-18T00:00:00.000Z",
          leaveTypeId: "leave-type",
          startDate: "2026-07-16T00:00:00.000Z",
        },
      },
    ],
    [
      "attendance filters",
      listAttendanceSchema,
      {
        query: {
          from: "2026-07-16T00:00:00.000Z",
          to: "2026-07-18T23:59:59.000Z",
        },
      },
    ],
  ])("rejects timestamp-shaped %s", (_label, schema, input) => {
    expect(schema.safeParse(input).success).toBe(false);
  });
});
