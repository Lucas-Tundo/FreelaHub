import { NextResponse } from "next/server";
import { z } from "zod";

import { listOpportunities } from "@/lib/opportunities";
import { TrackingStatusSchema } from "@/lib/types";

const QuerySchema = z.object({
  platform: z.string().optional(),
  kind: z.enum(["freelance", "vaga"]).optional(),
  minScore: z.coerce.number().optional(),
  status: TrackingStatusSchema.optional(),
});

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const query = QuerySchema.parse({
    platform:
      searchParams.get("platform") === "all"
        ? undefined
        : (searchParams.get("platform") ?? undefined),
    kind:
      searchParams.get("kind") === "all"
        ? undefined
        : (searchParams.get("kind") as "freelance" | "vaga" | null) ??
          undefined,
    minScore: searchParams.get("minScore") ?? undefined,
    status:
      searchParams.get("status") === "all"
        ? undefined
        : (searchParams.get("status") ?? undefined),
  });

  const opportunities = listOpportunities({
    platform: query.platform,
    kind: query.kind,
    minScore: query.minScore,
    status: query.status,
  });

  return NextResponse.json(opportunities);
}
