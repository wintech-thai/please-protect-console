/**
 * Next.js Instrumentation — runs once when the server starts.
 *
 * Hooks a WebSocket server onto the same HTTP server that Next.js uses
 * (path `/ws`). Works in both Turbopack dev and standalone production.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startTerminalWsServer } = await import("@/lib/terminal-ws-server");
    startTerminalWsServer();
  }
}
