import type { Server } from "node:http";

import type { Logger } from "pino";

export const DEFAULT_SHUTDOWN_TIMEOUT_MS = 10_000;

interface GracefulShutdownDependencies {
  disconnect: () => Promise<void>;
  logger: Pick<Logger, "error" | "info" | "warn">;
  server: Server;
  timeoutMs?: number;
}

export const createGracefulShutdown = ({
  disconnect,
  logger,
  server,
  timeoutMs = DEFAULT_SHUTDOWN_TIMEOUT_MS,
}: GracefulShutdownDependencies) => {
  let shutdownPromise: Promise<void> | undefined;

  return (signal: NodeJS.Signals): Promise<void> => {
    shutdownPromise ??= (async () => {
      const deadline = Date.now() + timeoutMs;
      logger.info({ signal, timeoutMs }, "Graceful shutdown started");

      await new Promise<void>((resolve) => {
        let finished = false;
        const finish = () => {
          if (finished) {
            return;
          }

          finished = true;
          clearTimeout(timeout);
          resolve();
        };
        const timeout = setTimeout(() => {
          logger.warn(
            { signal, timeoutMs },
            "Graceful shutdown timed out; forcing connections closed",
          );
          server.closeAllConnections?.();
          finish();
        }, timeoutMs);

        timeout.unref();
        server.close((error) => {
          if (error) {
            logger.error({ err: error, signal }, "HTTP server close failed");
          }

          finish();
        });
        server.closeIdleConnections?.();
      });

      try {
        const remainingMs = Math.max(0, deadline - Date.now());
        let disconnectTimeout: NodeJS.Timeout | undefined;
        await Promise.race([
          disconnect(),
          new Promise<never>((_resolve, reject) => {
            disconnectTimeout = setTimeout(
              () => reject(new Error("Prisma disconnect timed out")),
              remainingMs,
            );
            disconnectTimeout.unref();
          }),
        ]).finally(() => {
          if (disconnectTimeout) {
            clearTimeout(disconnectTimeout);
          }
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "Prisma disconnect timed out"
        ) {
          logger.warn({ signal, timeoutMs }, "Prisma disconnect timed out");
        } else {
          logger.error({ signal }, "Prisma disconnect failed");
        }
      }

      logger.info({ signal }, "Graceful shutdown completed");
    })();

    return shutdownPromise;
  };
};
