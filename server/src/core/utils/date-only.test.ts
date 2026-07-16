import { addDateOnlyDays, formatDateOnly, parseDateOnly } from "./date-only";

describe("date-only", () => {
  it("round-trips a calendar date without applying a timezone", () => {
    expect(formatDateOnly(parseDateOnly("2026-07-16"))).toBe("2026-07-16");
  });

  it("adds calendar days across month and leap-year boundaries", () => {
    expect(addDateOnlyDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDateOnlyDays("2024-02-29", 1)).toBe("2024-03-01");
  });

  it.each(["2026-02-30", "2026-7-16", "not-a-date"])(
    "rejects invalid date-only input %s",
    (value) => {
      expect(() => parseDateOnly(value)).toThrow("Invalid date-only value");
    },
  );
});
