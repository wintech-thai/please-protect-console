import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const BACKEND_URL = "http://tunnel-api-dev.rtarf-censor.dev-hubs.com";

async function handleProxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const endpoint = path.join("/");
    const targetUrl = `${BACKEND_URL}/${endpoint}`;

    console.log(`🚀 Proxying [${req.method}] to: ${targetUrl}`);

    let body = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      try {
        const textBody = await req.text();
        if (textBody) {
            body = JSON.parse(textBody); 
            console.log("📤 Sending Body:", body);
        }
      } catch (e) {
        console.warn("⚠️ Body parsing failed, sending empty body");
      }
    }

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    const isLoginPath = endpoint.toLowerCase().includes("login");
    if (!isLoginPath) {
        const authHeader = req.headers.get("Authorization");
        if (authHeader && authHeader !== "Bearer null" && authHeader !== "undefined") {
            headers["Authorization"] = authHeader;
        }
    } else {
        console.log("🚫 Skipping Authorization header for Login request");
    }

    const response = await axios({
        method: req.method,
        url: targetUrl,
        headers: headers,
        data: body,
        validateStatus: () => true, 
    });

    console.log(`📥 Backend Status: ${response.status}`);

    return NextResponse.json(response.data, { status: response.status });

  } catch (error: any) {
    console.error(`🔥 Proxy Error:`, error.message);
    return NextResponse.json(
      { message: "Proxy Connection Failed", error: error.message },
      { status: 500 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const PATCH = handleProxy;