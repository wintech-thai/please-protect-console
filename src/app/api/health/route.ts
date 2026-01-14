import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json(
      {
        status: "UP",
        timestamp: new Date().toISOString(),
        services: {
          database: "HEALTHY", 
          uptime: process.uptime(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { 
        status: "DOWN", 
        timestamp: new Date().toISOString(),
        error: "Internal Server Error" 
      },
      { status: 503 } 
    );
  }
}