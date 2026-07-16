import { addDateOnlyDays, formatDateOnly, parseDateOnly } from "./date-only";

interface ZonedDateTime {
  day: number;
  hour: number;
  minute: number;
  month: number;
  second: number;
  year: number;
}

const getPart = (parts: Intl.DateTimeFormatPart[], type: string) => {
  const value = parts.find((part) => part.type === type)?.value;

  if (!value) {
    throw new Error(`Missing ${type} date part.`);
  }

  return Number(value);
};

export const getZonedDateTime = (
  date: Date,
  timeZone: string,
): ZonedDateTime => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);

  return {
    day: getPart(parts, "day"),
    hour: getPart(parts, "hour"),
    minute: getPart(parts, "minute"),
    month: getPart(parts, "month"),
    second: getPart(parts, "second"),
    year: getPart(parts, "year"),
  };
};

const zonedDateTimeToUtc = (zonedDateTime: ZonedDateTime, timeZone: string) => {
  const desiredAsUtc = Date.UTC(
    zonedDateTime.year,
    zonedDateTime.month - 1,
    zonedDateTime.day,
    zonedDateTime.hour,
    zonedDateTime.minute,
    zonedDateTime.second,
  );
  let candidate = new Date(desiredAsUtc);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const actual = getZonedDateTime(candidate, timeZone);
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
    );
    const correction = desiredAsUtc - actualAsUtc;

    if (correction === 0) {
      return candidate;
    }

    candidate = new Date(candidate.getTime() + correction);
  }

  return candidate;
};

export const getCompanyDateKey = (date: Date, timeZone: string) => {
  const zoned = getZonedDateTime(date, timeZone);

  return formatDateOnly(
    new Date(Date.UTC(zoned.year, zoned.month - 1, zoned.day)),
  );
};

export const getCompanyDate = (date: Date, timeZone: string) =>
  parseDateOnly(getCompanyDateKey(date, timeZone));

export const getCompanyDateRange = (
  date: Date,
  timeZone: string,
  dayCount: number,
) => {
  const endDate = getCompanyDateKey(date, timeZone);
  const dateKeys = Array.from({ length: dayCount }, (_item, index) =>
    addDateOnlyDays(endDate, index - dayCount + 1),
  );

  return {
    dateKeys,
    endExclusive: parseDateOnly(addDateOnlyDays(endDate, 1)),
    start: parseDateOnly(dateKeys[0]),
    today: parseDateOnly(endDate),
    todayKey: endDate,
  };
};

const getTimeParts = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);

  return { hour, minute };
};

export const getScheduledTime = (
  date: Date,
  timeZone: string,
  time: string,
) => {
  const zoned = getZonedDateTime(date, timeZone);
  const { hour, minute } = getTimeParts(time);

  return zonedDateTimeToUtc(
    {
      ...zoned,
      hour,
      minute,
      second: 0,
    },
    timeZone,
  );
};

export const getZonedWeekday = (date: Date, timeZone: string) => {
  const { day, month, year } = getZonedDateTime(date, timeZone);

  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
};

export const isWorkingDay = (
  date: Date,
  timeZone: string,
  weeklyWorkingDays: number[],
) => weeklyWorkingDays.includes(getZonedWeekday(date, timeZone));
