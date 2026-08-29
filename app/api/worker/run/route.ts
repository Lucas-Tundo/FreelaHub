import { NextResponse } from "next/server";

import { startWorkerInBackground } from "@/lib/worker-runner";

export async function POST(): Promise<NextResponse> {
  const result = startWorkerInBackground();

  if (!result.started) {
    return NextResponse.json(
      { started: false, reason: result.reason },
      { status: 409 },
    );
  }

  return NextResponse.json({ started: true }, { status: 202 });
}
