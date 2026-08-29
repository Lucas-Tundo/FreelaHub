import { z } from "zod";

export const OpportunityKindSchema = z.enum(["freelance", "vaga"]);
export type OpportunityKind = z.infer<typeof OpportunityKindSchema>;

export const PlatformSchema = z.enum([
  "freelancer",
  "workana",
  "99freelas",
  "trampos",
]);
export type Platform = z.infer<typeof PlatformSchema>;

export const TrackingStatusSchema = z.enum([
  "nova",
  "descartada",
  "enviada",
  "respondeu",
  "fechou",
  "perdeu",
]);
export type TrackingStatus = z.infer<typeof TrackingStatusSchema>;

export const ScoreBreakdownSchema = z.record(z.string(), z.unknown());
export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;

export const OpportunityRowSchema = z.object({
  id: z.number(),
  kind: OpportunityKindSchema.default("freelance"),
  platform: PlatformSchema,
  external_id: z.string(),
  url: z.string(),
  title: z.string(),
  description: z.string(),
  budget: z.number().nullable(),
  budget_currency: z.string(),
  proposals_count: z.number(),
  client_country: z.string().nullable(),
  client_verified: z.number(),
  company_name: z.string().nullable(),
  location: z.string().nullable(),
  remote: z.number(),
  employment_type: z.string().nullable(),
  salary_min: z.number().nullable(),
  salary_max: z.number().nullable(),
  posted_at: z.string(),
  score: z.number(),
  score_breakdown: z.string(),
  content_hash: z.string(),
  created_at: z.string(),
  status: TrackingStatusSchema,
  sent_at: z.string().nullable(),
  replied_at: z.string().nullable(),
  closed_value: z.number().nullable(),
  notes: z.string().nullable(),
  proposal_body: z.string().nullable(),
  proposal_is_weak: z.number().nullable(),
  proposal_weak_reason: z.string().nullable(),
  proposal_regenerated_count: z.number().nullable(),
  proposal_template_used: z.string().nullable(),
});

export type OpportunityRow = z.infer<typeof OpportunityRowSchema>;

export const TemplateMetricSchema = z.object({
  template: z.string(),
  enviadas: z.number(),
  respostas: z.number(),
  taxa_resposta: z.number(),
});
export type TemplateMetric = z.infer<typeof TemplateMetricSchema>;

export const MetricsSchema = z.object({
  novas_hoje: z.number(),
  enviadas: z.number(),
  respondeu: z.number(),
  fechou: z.number(),
  perdeu: z.number(),
  descartadas: z.number(),
  taxa_resposta: z.number(),
  valor_fechado: z.number(),
  templates: z.array(TemplateMetricSchema),
});
export type Metrics = z.infer<typeof MetricsSchema>;

export const UpdateTrackingSchema = z.object({
  status: TrackingStatusSchema.optional(),
  notes: z.string().optional(),
  closed_value: z.number().optional(),
});
export type UpdateTrackingInput = z.infer<typeof UpdateTrackingSchema>;
