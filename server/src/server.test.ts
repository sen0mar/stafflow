describe("server bootstrap signal lifecycle", () => {
  it("does not register listeners on import and removes them when the server closes", async () => {
    const initialSigtermListeners = process.listenerCount("SIGTERM");
    const initialSigintListeners = process.listenerCount("SIGINT");
    const { env } = await import("./config/env.js");
    const { startServer } = await import("./server.js");

    expect(process.listenerCount("SIGTERM")).toBe(initialSigtermListeners);
    expect(process.listenerCount("SIGINT")).toBe(initialSigintListeners);

    const originalPort = env.PORT;
    env.PORT = 0;
    const server = startServer();
    await new Promise<void>((resolve) => {
      if (server.listening) {
        resolve();
        return;
      }

      server.once("listening", resolve);
    });

    expect(process.listenerCount("SIGTERM")).toBe(initialSigtermListeners + 1);
    expect(process.listenerCount("SIGINT")).toBe(initialSigintListeners + 1);

    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    env.PORT = originalPort;

    expect(process.listenerCount("SIGTERM")).toBe(initialSigtermListeners);
    expect(process.listenerCount("SIGINT")).toBe(initialSigintListeners);
  });
});
