import { NextResponse } from "next/server";

import { getRecentActivity, getRecentErrors } from "@/lib/activity-log";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const errorsOnly = searchParams.get("errors") === "true";
  const limit = Number(searchParams.get("limit") ?? "10");

  const entries = errorsOnly
    ? getRecentErrors(limit)
    : getRecentActivity(limit);

  return NextResponse.json(entries);
}
