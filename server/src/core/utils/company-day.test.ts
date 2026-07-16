import {
  getCompanyDate,
  getCompanyDateKey,
  getCompanyDateRange,
  getScheduledTime,
  getZonedWeekday,
  isWorkingDay,
} from "./company-day";

describe("company-day", () => {
  it.each([
    ["UTC-08", "America/Los_Angeles", "2026-07-16T20:00:00.000Z"],
    ["UTC", "UTC", "2026-07-16T12:00:00.000Z"],
    ["UTC+14", "Pacific/Kiritimati", "2026-07-15T22:00:00.000Z"],
  ])("derives a stable date-only key in %s", (_label, timeZone, instant) => {
    expect(getCompanyDateKey(new Date(instant), timeZone)).toBe("2026-07-16");
    expect(getCompanyDate(new Date(instant), timeZone).toISOString()).toBe(
      "2026-07-16T00:00:00.000Z",
    );
  });

  it("keeps adjacent UTC instants on their company-local calendar dates", () => {
    const beforeMidnight = new Date("2026-07-16T06:59:59.000Z");
    const afterMidnight = new Date("2026-07-16T07:00:00.000Z");

    expect(getCompanyDateKey(beforeMidnight, "America/Los_Angeles")).toBe(
      "2026-07-15",
    );
    expect(getCompanyDateKey(afterMidnight, "America/Los_Angeles")).toBe(
      "2026-07-16",
    );
  });

  it("builds inclusive calendar-date windows without timezone offsets", () => {
    expect(
      getCompanyDateRange(
        new Date("2026-07-16T20:00:00.000Z"),
        "America/Los_Angeles",
        3,
      ),
    ).toMatchObject({
      dateKeys: ["2026-07-14", "2026-07-15", "2026-07-16"],
      endExclusive: new Date("2026-07-17T00:00:00.000Z"),
      start: new Date("2026-07-14T00:00:00.000Z"),
      today: new Date("2026-07-16T00:00:00.000Z"),
    });
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
    "preserves Section 11 scheduled local time on the New York %s day",
    (_label, now, expected) => {
      expect(
        getScheduledTime(
          new Date(now),
          "America/New_York",
          "09:00",
        ).toISOString(),
      ).toBe(expected);
    },
  );
});
