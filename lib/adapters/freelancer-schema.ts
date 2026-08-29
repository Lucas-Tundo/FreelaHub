import { z } from "zod";

const FreelancerBidStatsSchema = z.object({
  bid_count: z.number().optional(),
  bid_avg: z.number().optional(),
});

const FreelancerBudgetSchema = z.object({
  minimum: z.number().optional(),
  maximum: z.number().optional(),
});

const FreelancerCurrencySchema = z.object({
  code: z.string(),
});

const FreelancerCountrySchema = z.object({
  code: z.string().optional(),
});

const FreelancerLocationSchema = z.object({
  country: FreelancerCountrySchema.optional(),
});

const FreelancerUserStatusSchema = z.object({
  payment_verified: z.boolean().optional(),
  identity_verified: z.boolean().optional(),
  email_verified: z.boolean().optional(),
});

const FreelancerUserSchema = z.object({
  id: z.number().optional(),
  status: FreelancerUserStatusSchema.optional(),
  location: FreelancerLocationSchema.optional(),
});

export const FreelancerProjectSchema = z
  .object({
    id: z.number(),
    title: z.string(),
    description: z.string().optional(),
    seo_url: z.string().optional(),
    budget: FreelancerBudgetSchema.optional(),
    currency: FreelancerCurrencySchema.optional(),
    bid_stats: FreelancerBidStatsSchema.optional(),
    time_submitted: z.number().optional(),
    submitdate: z.number().optional(),
    location: FreelancerLocationSchema.optional(),
    owner_id: z.number().optional(),
    users: z.array(FreelancerUserSchema).optional(),
  })
  .passthrough();

export const FreelancerSearchResponseSchema = z
  .object({
    status: z.string(),
    result: z
      .object({
        projects: z.array(FreelancerProjectSchema),
        total_count: z.number().optional(),
      })
      .passthrough(),
  })
  .passthrough();

export type FreelancerProject = z.infer<typeof FreelancerProjectSchema>;

export function unixToIso(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

export function buildProjectUrl(seoUrl: string | undefined, projectId: number): string {
  if (seoUrl) {
    return `https://www.freelancer.com/projects/${seoUrl}`;
  }
  return `https://www.freelancer.com/projects/${projectId}`;
}

export function extractBudget(
  budget: FreelancerProject["budget"],
): number | null {
  if (!budget) return null;
  if (budget.maximum !== undefined) return budget.maximum;
  if (budget.minimum !== undefined) return budget.minimum;
  return null;
}

export function extractClientCountry(project: FreelancerProject): string | null {
  const fromProject = project.location?.country?.code;
  if (fromProject) return fromProject.toUpperCase();

  const owner = project.users?.find((user) => user.id === project.owner_id);
  const fromOwner = owner?.location?.country?.code;
  if (fromOwner) return fromOwner.toUpperCase();

  return null;
}

export function extractClientVerified(project: FreelancerProject): boolean {
  const owner = project.users?.find((user) => user.id === project.owner_id);
  const status = owner?.status;

  return Boolean(
    status?.payment_verified ||
      status?.identity_verified ||
      status?.email_verified,
  );
}

export function extractPostedAt(project: FreelancerProject): string {
  const timestamp = project.time_submitted ?? project.submitdate;
  if (!timestamp) {
    throw new Error(
      `Projeto Freelancer ${project.id} sem time_submitted/submitdate`,
    );
  }
  return unixToIso(timestamp);
}
