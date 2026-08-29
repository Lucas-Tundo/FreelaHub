import { NextResponse } from "next/server";
import { z } from "zod";

import { updateTracking } from "@/lib/opportunities";
import { UpdateTrackingSchema } from "@/lib/types";

const ParamsSchema = z.object({
  id: z.coerce.number(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const params = ParamsSchema.parse(await context.params);
    const body = UpdateTrackingSchema.parse(await request.json());
    const updated = updateTracking(params.id, body);
    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao atualizar tracking";
    const status = error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
