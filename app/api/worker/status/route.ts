import { NextResponse } from "next/server";

import { getWorkerStatus } from "@/lib/worker-runner";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(getWorkerStatus());
}
