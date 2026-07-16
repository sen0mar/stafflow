import type { Request, Response } from "express";

interface AuthFailureLocals {
  expectedAuthFailure?: boolean;
}

interface ResponseWithAuthFailureLocals {
  locals?: AuthFailureLocals;
}

interface RequestWithAuthFailure {
  expectedAuthFailure?: boolean;
}

export const markExpectedAuthFailure = (
  request: Request,
  response: Response,
) => {
  (request as RequestWithAuthFailure).expectedAuthFailure = true;
  response.locals.expectedAuthFailure = true;
};

export const isExpectedAuthFailure = (response: unknown) =>
  Boolean(
    (response as RequestWithAuthFailure).expectedAuthFailure ||
    (response as ResponseWithAuthFailureLocals).locals?.expectedAuthFailure,
  );
