import { z } from "zod";

export const requestInputLimits = {
  emailCharacters: 254,
  idCharacters: 128,
  publicTokenCharacters: 128,
  searchCharacters: 200,
} as const;

export const idInputSchema = z
  .string()
  .trim()
  .min(1)
  .max(requestInputLimits.idCharacters);

export const optionalIdInputSchema = z
  .string()
  .trim()
  .max(requestInputLimits.idCharacters)
  .transform((value) => (value.length > 0 ? value : null))
  .optional()
  .nullable();

export const searchInputSchema = z
  .string()
  .trim()
  .max(requestInputLimits.searchCharacters);

export const emailInputSchema = z
  .string()
  .trim()
  .max(requestInputLimits.emailCharacters)
  .email()
  .toLowerCase();

export const publicTokenInputSchema = z
  .string()
  .min(32)
  .max(requestInputLimits.publicTokenCharacters);
