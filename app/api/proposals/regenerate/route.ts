import { NextResponse } from "next/server";
import { z } from "zod";

import { generateAndSaveProposal } from "@/lib/proposals";

const RegenerateSchema = z.object({
  opportunity_id: z.number().int().positive(),
  adjustment: z.string().trim().optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = RegenerateSchema.parse(await request.json());
    const updated = await generateAndSaveProposal(
      body.opportunity_id,
      body.adjustment,
    );

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao regerar proposta";
    const status = error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
