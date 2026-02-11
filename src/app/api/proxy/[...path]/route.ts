import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_URL;

async function handleProxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    
    const queryParams = req.nextUrl.search; 
    const endpoint = path.join("/");
    const targetUrl = `${BACKEND_URL}/${endpoint}${queryParams}`;

    console.log(`🚀 Proxying [${req.method}] to: ${targetUrl}`);

    // --- จัดการ Body ---
    let body = null;
    const contentType = req.headers.get("content-type");

    if (req.method !== "GET" && req.method !== "HEAD") {
      if (contentType?.includes("application/json")) {
          try {
            const textBody = await req.text();
            if (textBody) {
                body = JSON.parse(textBody);
                console.log("📤 Sending JSON Body");
            }
          } catch (e) {
            console.warn("⚠️ JSON Body parsing failed");
          }
      } else {
          body = await req.blob(); 
          console.log("📤 Sending Blob/Form Body");
      }
    }

    // --- จัดการ Headers ---
    const headers: Record<string, string> = {};
    
    if (contentType) {
        headers["Content-Type"] = contentType;
    }

    const isLoginPath = endpoint.toLowerCase().includes("login");
    if (!isLoginPath) {
        const authHeader = req.headers.get("Authorization");
        if (authHeader && authHeader !== "Bearer null" && authHeader !== "undefined") {
            headers["Authorization"] = authHeader;
        }
    }

    const response = await axios({
        method: req.method,
        url: targetUrl,
        headers: headers,
        data: body,
        validateStatus: () => true, 
        responseType: 'arraybuffer' 
    });

    console.log(`📥 Backend Status: ${response.status}`);

    const responseHeaders = new Headers();
    Object.entries(response.headers).forEach(([key, value]) => {
        if (value && key !== 'content-length' && key !== 'content-encoding') {
             responseHeaders.set(key, String(value));
        }
    });

    return new NextResponse(response.data, {
        status: response.status,
        headers: responseHeaders
    });

  } catch (error: any) {
    console.error(`🔥 [Proxy Crash] Error:`, error.message);

    const isNetworkError = 
        error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT' || 
        error.message?.includes('aborted') ||
        error.message?.includes('socket hang up');

    if (isNetworkError) {
        console.warn("⚠️ Network error detected (Backend dropped connection). Sending 401 to trigger refresh.");
        return NextResponse.json(
            { 
                message: "Backend connection aborted (Token might be invalid or expired)", 
                code: "PROXY_FORCE_401" 
            },
            { status: 401 } 
        );
    }

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