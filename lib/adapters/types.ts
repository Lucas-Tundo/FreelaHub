import type { OpportunityKind, Platform } from "@/lib/types";

export interface RawProject {
  kind: OpportunityKind;
  platform: Platform;
  externalId: string;
  url: string;
  title: string;
  description: string;
  budget: number | null;
  budgetCurrency: string;
  proposalsCount: number;
  clientCountry: string | null;
  clientVerified: boolean;
  postedAt: string;
  companyName?: string | null;
  location?: string | null;
  remote?: boolean;
  employmentType?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
}

export interface FetchProjectsResult {
  projects: RawProject[];
  metadata: Record<string, unknown>;
}

export interface Adapter {
  readonly name: Platform;
  fetchProjects(): Promise<FetchProjectsResult>;
}

export class AdapterError extends Error {
  constructor(
    message: string,
    readonly platform: Platform,
    readonly metadata: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "AdapterError";
  }
}
