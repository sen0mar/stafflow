import bcrypt from "bcrypt";

import { AppError } from "../errors/app-error";

const bcryptRounds = 12;
const minPasswordLength = 12;
const maxBcryptPasswordBytes = 72;

// Bcrypt only uses the first 72 bytes, so reject longer passwords instead of
// silently truncating user input before hashing or verification.
export const validatePasswordConstraints = (password: string) => {
  const passwordByteLength = Buffer.byteLength(password, "utf8");

  if (password.length < minPasswordLength) {
    throw new AppError({
      code: "PASSWORD_TOO_SHORT",
      message: `Password must be at least ${minPasswordLength} characters.`,
      statusCode: 422,
    });
  }

  if (passwordByteLength > maxBcryptPasswordBytes) {
    throw new AppError({
      code: "PASSWORD_TOO_LONG",
      message: `Password must be ${maxBcryptPasswordBytes} bytes or fewer.`,
      statusCode: 422,
    });
  }
};

// Validate before hashing so every stored password hash follows the same policy.
export const hashPassword = async (password: string) => {
  validatePasswordConstraints(password);

  return bcrypt.hash(password, bcryptRounds);
};

// Keep verification separate from validation so existing hashes remain checkable.
export const verifyPassword = async (password: string, hash: string) =>
  bcrypt.compare(password, hash);
