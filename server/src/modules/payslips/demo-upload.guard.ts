import { env } from "../../config/env";
import { AppError } from "../../core/errors/app-error";

export const assertDemoUploadsAllowed = () => {
  if (env.DEMO_MODE && !env.DEMO_UPLOADS_ENABLED) {
    throw new AppError({
      code: "DEMO_UPLOADS_DISABLED",
      message: "Uploads are disabled in demo mode.",
      statusCode: 403,
    });
  }
};
