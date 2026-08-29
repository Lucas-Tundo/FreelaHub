import fs from "node:fs";
import path from "node:path";
import * as yaml from "js-yaml";
import { z } from "zod";

import {
  scoringConfigFromYaml,
  type ScoringConfig,
} from "@/lib/scoring";

const CaseSchema = z.object({
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
});

const ConfigSchema = z.object({
  profile: z.object({
    niche: z.string(),
    stack: z.string(),
    price_min: z.number(),
    price_max: z.number(),
    price_currency: z.string(),
    cases: z.array(CaseSchema),
  }),
  scoring: z.object({
    threshold: z.number(),
    keywords: z.array(z.string()),
    keyword_weight: z.number(),
    budget_bonus: z.number(),
    low_competition_bonus: z.number(),
    freshness_bonus: z.number(),
    verified_client_bonus: z.number(),
    preferred_countries: z.array(z.string()),
    blacklist: z.array(z.string()),
    blacklist_penalty: z.number(),
  }),
  platforms: z.record(
    z.string(),
    z.object({
      enabled: z.boolean(),
      cron: z.string().optional(),
      kind: z.enum(["freelance", "vaga"]).optional(),
    }),
  ),
  worker: z.object({
    request_delay_min_ms: z.number(),
    request_delay_max_ms: z.number(),
    respect_robots_txt: z.boolean(),
  }),
  proposal: z.object({
    max_words: z.number(),
    model: z.string(),
    language: z.string(),
  }),
});

export type AppConfig = z.infer<typeof ConfigSchema>;
export type { ScoringConfig };

let cachedConfig: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (cachedConfig) return cachedConfig;

  const configPath = path.join(process.cwd(), "config.yaml");
  const raw = fs.readFileSync(configPath, "utf-8");
  const parsed = yaml.load(raw);
  cachedConfig = ConfigSchema.parse(parsed);
  return cachedConfig;
}

export function getScoringConfig(): ScoringConfig {
  const config = loadConfig();
  return scoringConfigFromYaml(config.scoring, config.profile.price_min);
}
