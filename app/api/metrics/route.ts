import { NextResponse } from "next/server";

import { getMetrics } from "@/lib/metrics-db";

export async function GET(): Promise<NextResponse> {
  const metrics = getMetrics();
  return NextResponse.json(metrics);
}
