import { NextResponse } from "next/server.js";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: { doctors: [] },
  });
}
