import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./core/logger/logger";
import {
  createGracefulShutdown,
  DEFAULT_SHUTDOWN_TIMEOUT_MS,
} from "./core/server/graceful-shutdown";
import { prisma } from "./prisma/prisma.client";

export const startServer = () => {
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "Server listening");
  });

  const shutdown = createGracefulShutdown({
    disconnect: () => prisma.$disconnect(),
    logger,
    server,
    timeoutMs: DEFAULT_SHUTDOWN_TIMEOUT_MS,
  });

  const handleSignal = (signal: NodeJS.Signals) => {
    removeSignalHandlers();
    void shutdown(signal).then(() => {
      process.exitCode = 0;
    });
  };

  const handleSigterm = () => handleSignal("SIGTERM");
  const handleSigint = () => handleSignal("SIGINT");

  const removeSignalHandlers = () => {
    process.removeListener("SIGTERM", handleSigterm);
    process.removeListener("SIGINT", handleSigint);
  };

  process.once("SIGTERM", handleSigterm);
  process.once("SIGINT", handleSigint);
  server.once("close", removeSignalHandlers);

  server.on("error", (error) => {
    logger.fatal({ err: error, port: env.PORT }, "Server failed to start");
    process.exitCode = 1;
  });

  return server;
};

if (require.main === module) {
  startServer();
}
