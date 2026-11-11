import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok", service: "github-trending-monitor", timestamp: new Date().toISOString() });
}
