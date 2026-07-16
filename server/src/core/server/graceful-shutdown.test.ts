import { createServer, type Server } from "node:http";

import { createGracefulShutdown } from "./graceful-shutdown";

const logger = {
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};

const createPendingServer = () => {
  const close = vi.fn();
  const closeAllConnections = vi.fn();
  const closeIdleConnections = vi.fn();

  return {
    close,
    closeAllConnections,
    closeIdleConnections,
  } as unknown as Server;
};

describe("graceful shutdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is idempotent and disconnects Prisma exactly once after HTTP closes", async () => {
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const disconnect = vi.fn().mockResolvedValue(undefined);
    const shutdown = createGracefulShutdown({
      disconnect,
      logger,
      server,
      timeoutMs: 100,
    });

    const first = shutdown("SIGTERM");
    const second = shutdown("SIGINT");

    expect(second).toBe(first);
    await first;
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("forces lingering connections and still attempts one disconnect within the total budget", async () => {
    vi.useFakeTimers();
    const server = createPendingServer();
    const disconnect = vi.fn().mockResolvedValue(undefined);
    const shutdown = createGracefulShutdown({
      disconnect,
      logger,
      server,
      timeoutMs: 50,
    });

    const result = shutdown("SIGTERM");
    await vi.advanceTimersByTimeAsync(50);
    await result;

    expect(server.closeAllConnections).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      { signal: "SIGTERM", timeoutMs: 50 },
      "Graceful shutdown timed out; forcing connections closed",
    );
    vi.useRealTimers();
  });

  it("bounds a hanging disconnect inside the same shutdown deadline", async () => {
    vi.useFakeTimers();
    const server = createServer();
    const disconnect = vi.fn(() => new Promise<void>(() => undefined));
    const shutdown = createGracefulShutdown({
      disconnect,
      logger,
      server,
      timeoutMs: 40,
    });

    const result = shutdown("SIGINT");
    await vi.advanceTimersByTimeAsync(40);
    await result;

    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      { signal: "SIGINT", timeoutMs: 40 },
      "Prisma disconnect timed out",
    );
    vi.useRealTimers();
  });

  it("logs disconnect failures without serializing the failure or credentials", async () => {
    const server = createServer();
    const disconnect = vi
      .fn()
      .mockRejectedValue(new Error("postgresql://user:secret@database"));
    const shutdown = createGracefulShutdown({
      disconnect,
      logger,
      server,
      timeoutMs: 100,
    });

    await shutdown("SIGTERM");

    expect(logger.error).toHaveBeenCalledWith(
      { signal: "SIGTERM" },
      "Prisma disconnect failed",
    );
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain(
      "user:secret",
    );
  });
});
