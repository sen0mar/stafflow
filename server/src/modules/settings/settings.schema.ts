import { z } from "zod";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
  message: "Time must use HH:mm format.",
});

const timezoneSchema = z.string().trim().min(1).refine(
  (value) => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: value });

      return true;
    } catch {
      return false;
    }
  },
  { message: "Timezone must be a valid IANA timezone." },
);

const optionalTextSchema = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length > 0 ? value : null))
    .optional()
    .nullable();

const partialObject = <TShape extends z.ZodRawShape>(shape: TShape) =>
  z.object(shape).partial().refine((value) => Object.keys(value).length > 0, {
    message: "At least one settings field is required.",
  });

export const updateCompanySettingsSchema = z.object({
  body: partialObject({
    locale: z.string().trim().min(2).max(20),
    name: z.string().trim().min(1).max(120),
    timezone: timezoneSchema,
  }),
});

export const updateAttendanceSettingsSchema = z.object({
  body: partialObject({
    allowEmployeeClockIn: z.boolean(),
    lateGracePeriodMinutes: z.number().int().min(0).max(240),
    weeklyWorkingDays: z
      .array(z.number().int().min(0).max(6))
      .min(1)
      .max(7)
      .refine((value) => new Set(value).size === value.length, {
        message: "Weekly working days must be unique.",
      }),
    workdayEnd: timeSchema,
    workdayMinutes: z.number().int().min(1).max(1_440),
    workdayStart: timeSchema,
  }),
});

export const updateLeaveSettingsSchema = z.object({
  body: partialObject({
    allowNegativeBalance: z.boolean(),
    defaultAnnualAllowanceDays: z.number().min(0).max(365),
    policyText: optionalTextSchema(2_000),
  }),
});

export type UpdateCompanySettingsInput = z.infer<
  typeof updateCompanySettingsSchema
>["body"];
export type UpdateAttendanceSettingsInput = z.infer<
  typeof updateAttendanceSettingsSchema
>["body"];
export type UpdateLeaveSettingsInput = z.infer<
  typeof updateLeaveSettingsSchema
>["body"];
