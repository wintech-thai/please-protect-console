import { NextResponse } from "next/server";

/**
 * Simple readiness endpoint for the terminal WebSocket proxy.
 * The actual WebSocket runs on the same port as Next.js (path `/ws`).
 */
export async function GET() {
  return NextResponse.json({ ready: true });
}
