import {
  getAttendanceDate,
  getScheduledTime,
  getZonedWeekday,
  isWorkingDay,
} from "./attendance-time";

describe("attendance-time", () => {
  it("keeps adjacent UTC instants on their company-local calendar dates", () => {
    const beforeMidnight = new Date("2026-07-16T03:59:59.000Z");
    const afterMidnight = new Date("2026-07-16T04:00:00.000Z");

    expect(
      getAttendanceDate(beforeMidnight, "America/New_York").toISOString(),
    ).toBe("2026-07-15T04:00:00.000Z");
    expect(
      getAttendanceDate(afterMidnight, "America/New_York").toISOString(),
    ).toBe("2026-07-16T04:00:00.000Z");
  });

  it("uses the company-local weekday instead of the UTC weekday", () => {
    const sundayUtcSaturdayLocal = new Date("2026-07-19T02:00:00.000Z");

    expect(getZonedWeekday(sundayUtcSaturdayLocal, "America/New_York")).toBe(6);
    expect(isWorkingDay(sundayUtcSaturdayLocal, "America/New_York", [6])).toBe(
      true,
    );
    expect(isWorkingDay(sundayUtcSaturdayLocal, "America/New_York", [0])).toBe(
      false,
    );
  });

  it.each([
    [
      "spring transition",
      "2026-03-08T16:00:00.000Z",
      "2026-03-08T13:00:00.000Z",
    ],
    ["fall transition", "2026-11-01T17:00:00.000Z", "2026-11-01T14:00:00.000Z"],
  ])(
    "resolves scheduled local time on the New York %s day",
    (_, now, expected) => {
      expect(
        getScheduledTime(
          new Date(now),
          "America/New_York",
          "09:00",
        ).toISOString(),
      ).toBe(expected);
    },
  );

  it.each([
    ["spring transition", "2026-03-08T05:00:00.000Z"],
    ["fall transition", "2026-11-01T04:00:00.000Z"],
  ])(
    "stores local midnight correctly on the New York %s day",
    (_, expected) => {
      const noon =
        expected === "2026-03-08T05:00:00.000Z"
          ? new Date("2026-03-08T16:00:00.000Z")
          : new Date("2026-11-01T17:00:00.000Z");

      expect(getAttendanceDate(noon, "America/New_York").toISOString()).toBe(
        expected,
      );
    },
  );
});
