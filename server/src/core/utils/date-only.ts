const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export const parseDateOnly = (value: string) => {
  const match = dateOnlyPattern.exec(value);

  if (!match) {
    throw new Error(`Invalid date-only value: ${value}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Invalid date-only value: ${value}`);
  }

  return date;
};

export const formatDateOnly = (date: Date) =>
  `${String(date.getUTCFullYear()).padStart(4, "0")}-${String(
    date.getUTCMonth() + 1,
  ).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;

export const addDateOnlyDays = (value: string, amount: number) => {
  const date = parseDateOnly(value);
  date.setUTCDate(date.getUTCDate() + amount);

  return formatDateOnly(date);
};
