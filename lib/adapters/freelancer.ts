import { loadConfig } from "@/lib/config";
import {
  buildProjectUrl,
  extractBudget,
  extractClientCountry,
  extractClientVerified,
  extractPostedAt,
  FreelancerSearchResponseSchema,
  type FreelancerProject,
} from "@/lib/adapters/freelancer-schema";
import { AdapterError, type Adapter, type FetchProjectsResult, type RawProject } from "@/lib/adapters/types";

const DEFAULT_API_URL = "https://www.freelancer.com/api";
const ACTIVE_PROJECTS_PATH = "/projects/0.1/projects/active/";

function getApiBaseUrl(): string {
  return process.env.FLN_API_URL ?? DEFAULT_API_URL;
}

function getOAuthToken(): string {
  const token = process.env.FLN_OAUTH_TOKEN;
  if (!token) {
    throw new AdapterError(
      "FLN_OAUTH_TOKEN não configurado no .env",
      "freelancer",
    );
  }
  return token;
}

function buildSearchQuery(keywords: string[]): string {
  return keywords.slice(0, 5).join(" ");
}

function mapProject(project: FreelancerProject): RawProject {
  const description = project.description ?? "";

  if (!description.trim()) {
    throw new AdapterError(
      `Projeto Freelancer ${project.id} retornou sem descrição. Verifique a projeção full_description=true.`,
      "freelancer",
      { projectId: project.id },
    );
  }

  return {
    kind: "freelance",
    platform: "freelancer",
    externalId: String(project.id),
    url: buildProjectUrl(project.seo_url, project.id),
    title: project.title,
    description,
    budget: extractBudget(project.budget),
    budgetCurrency: project.currency?.code ?? "USD",
    proposalsCount: project.bid_stats?.bid_count ?? 0,
    clientCountry: extractClientCountry(project),
    clientVerified: extractClientVerified(project),
    postedAt: extractPostedAt(project),
  };
}

export function createFreelancerAdapter(): Adapter {
  return {
    name: "freelancer",

    async fetchProjects(): Promise<FetchProjectsResult> {
      const config = loadConfig();
      const token = getOAuthToken();
      const baseUrl = getApiBaseUrl().replace(/\/$/, "");
      const url = new URL(`${baseUrl}${ACTIVE_PROJECTS_PATH}`);

      url.searchParams.set("query", buildSearchQuery(config.scoring.keywords));
      url.searchParams.set("limit", "20");
      url.searchParams.set("full_description", "true");
      url.searchParams.set("user_details", "true");
      url.searchParams.set("sort_field", "time_submitted");

      const response = await fetch(url.toString(), {
        headers: {
          "Freelancer-OAuth-V1": token,
          Accept: "application/json",
        },
      });

      const rawBody: unknown = await response.json();

      if (!response.ok) {
        throw new AdapterError(
          `Freelancer API retornou HTTP ${response.status}`,
          "freelancer",
          { status: response.status, body: rawBody },
        );
      }

      const parsed = FreelancerSearchResponseSchema.safeParse(rawBody);
      if (!parsed.success) {
        throw new AdapterError(
          "Resposta da Freelancer API com formato inesperado",
          "freelancer",
          { issues: parsed.error.issues, body: rawBody },
        );
      }

      if (parsed.data.status !== "success") {
        throw new AdapterError(
          `Freelancer API retornou status ${parsed.data.status}`,
          "freelancer",
          { body: parsed.data },
        );
      }

      if (!parsed.data.result?.projects) {
        throw new AdapterError(
          "Freelancer API não retornou result.projects",
          "freelancer",
          { body: parsed.data },
        );
      }

      const projects = parsed.data.result.projects.map(mapProject);

      return {
        projects,
        metadata: {
          totalCount: parsed.data.result.total_count ?? projects.length,
          query: url.searchParams.get("query"),
          endpoint: url.toString(),
        },
      };
    },
  };
}
