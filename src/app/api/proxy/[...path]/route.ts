import { NextRequest, NextResponse } from "next/server";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const BACKEND_URL = "https://api-dev.rtarf-censor.dev-hubs.com";

async function handleProxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const endpoint = path.join("/");
    const targetUrl = `${BACKEND_URL}/${endpoint}`;
    
    console.log(`🚀 Proxying [${req.method}] to: ${targetUrl}`);

    // 1. อ่าน Body
    let body = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const textBody = await req.text();
      try {
        if (textBody) {
             body = JSON.stringify(JSON.parse(textBody));
             console.log("📤 Sending JSON Body:", body);
        }
      } catch (e) {
        body = textBody;
      }
    }

    // 2. เตรียม Headers
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set("Connection", "close");

    const isLoginPath = endpoint.toLowerCase().includes("login");

    if (!isLoginPath) {
        const authHeader = req.headers.get("Authorization");
        if (authHeader && authHeader !== "Bearer null" && authHeader !== "undefined") {
            headers.set("Authorization", authHeader);
        }
    } else {
        console.log("🚫 Skipping Authorization header for Login request");
    }

    // 3. ยิง Request
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
      cache: "no-store",
    });

    // 4. อ่าน Response
    const responseText = await response.text();
    console.log(`📥 Backend Status: ${response.status}`);

    let responseData;
    try {
        responseData = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
        console.warn("⚠️ Non-JSON response received:", responseText);
        responseData = { 
            status: "error", 
            message: "Backend returned non-JSON response", 
            raw: responseText 
        };
    }

    return NextResponse.json(responseData, { status: response.status });

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