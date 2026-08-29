import { createHash } from "node:crypto";

export interface DedupeInput {
  platform: string;
  externalId: string;
  title: string;
  description: string;
}

export function computeContentHash(input: DedupeInput): string {
  const payload = [
    input.platform,
    input.externalId,
    input.title.trim(),
    input.description.trim(),
  ].join("|");

  return createHash("sha256").update(payload, "utf8").digest("hex");
}

export function isKnownContentHash(
  existingHashes: ReadonlySet<string>,
  contentHash: string,
): boolean {
  return existingHashes.has(contentHash);
}
