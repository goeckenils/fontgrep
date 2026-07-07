import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    ts: Math.floor(Date.now() / 1000),
    env: env.NODE_ENV,
  });
}
