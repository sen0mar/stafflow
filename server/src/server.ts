import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./core/logger/logger";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "Server listening");
});

server.on("error", (error) => {
  logger.fatal({ err: error, port: env.PORT }, "Server failed to start");
  process.exit(1);
});
