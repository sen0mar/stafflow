export const getAllowedQueryValue = <TValue extends string>(
  value: string | null | undefined,
  allowedValues: readonly TValue[],
  fallback: TValue,
): TValue =>
  allowedValues.find((allowedValue) => allowedValue === value) ?? fallback

export const getOptionalAllowedQueryValue = <TValue extends string>(
  value: string | null | undefined,
  allowedValues: readonly TValue[],
): TValue | undefined =>
  allowedValues.find((allowedValue) => allowedValue === value)
