import { create99FreelasAdapter } from "@/lib/adapters/99freelas";
import { createFreelancerAdapter } from "@/lib/adapters/freelancer";
import { createTramposAdapter } from "@/lib/adapters/trampos";
import { createWorkanaAdapter } from "@/lib/adapters/workana";
import { AdapterError, type Adapter } from "@/lib/adapters/types";
import { logActivity } from "@/lib/activity-log";
import { getScoringConfig, loadConfig } from "@/lib/config";
import { isKnownContentHash, computeContentHash } from "@/lib/dedupe";
import { generateAndSaveProposal } from "@/lib/proposals";
import { getExistingContentHashes, saveScoredProject } from "@/lib/repository";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function randomDelayMs(minMs: number, maxMs: number): number {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

function getEnabledAdapters(): Adapter[] {
  const config = loadConfig();
  const adapters: Adapter[] = [];

  if (config.platforms.freelancer?.enabled) {
    adapters.push(createFreelancerAdapter());
  }

  if (config.platforms.workana?.enabled) {
    adapters.push(createWorkanaAdapter());
  }

  if (config.platforms["99freelas"]?.enabled) {
    adapters.push(create99FreelasAdapter());
  }

  if (config.platforms.trampos?.enabled) {
    adapters.push(createTramposAdapter());
  }

  return adapters;
}

export async function runWorkerCycle(): Promise<void> {
  const config = loadConfig();
  const scoringConfig = getScoringConfig();
  const adapters = getEnabledAdapters();

  if (adapters.length === 0) {
    logActivity(null, "warn", "Nenhuma plataforma habilitada no config.yaml");
    return;
  }

  logActivity(null, "info", "Worker iniciado", {
    platforms: adapters.map((adapter) => adapter.name),
  });

  const knownHashes = getExistingContentHashes();
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalProposals = 0;
  const threshold = config.scoring.threshold;

  for (const adapter of adapters) {
    try {
      logActivity(adapter.name, "info", `Coletando projetos de ${adapter.name}`);
      const { projects, metadata } = await adapter.fetchProjects();

      for (const project of projects) {
        const contentHash = computeContentHash({
          platform: project.platform,
          externalId: project.externalId,
          title: project.title,
          description: project.description,
        });

        if (isKnownContentHash(knownHashes, contentHash)) {
          totalSkipped += 1;
          continue;
        }

        const saved = saveScoredProject(project, scoringConfig);
        knownHashes.add(saved.contentHash);

        if (saved.inserted && saved.opportunityId) {
          totalInserted += 1;

          if (saved.score >= threshold) {
            try {
              await generateAndSaveProposal(saved.opportunityId);
              totalProposals += 1;
              logActivity(
                adapter.name,
                "info",
                `Proposta gerada para oportunidade ${saved.opportunityId}`,
                { score: saved.score },
              );
            } catch (proposalError) {
              const message =
                proposalError instanceof Error
                  ? proposalError.message
                  : "Erro ao gerar proposta";
              logActivity(adapter.name, "error", message, {
                opportunityId: saved.opportunityId,
              });
            }
          }
        } else {
          totalSkipped += 1;
        }
      }

      logActivity(adapter.name, "info", `Coleta concluída: ${adapter.name}`, {
        fetched: projects.length,
        inserted: totalInserted,
        skipped: totalSkipped,
        metadata,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido na coleta";
      const metadata =
        error instanceof AdapterError
          ? { ...error.metadata, stack: error.stack }
          : { stack: error instanceof Error ? error.stack : undefined };

      logActivity(adapter.name, "error", message, metadata);
    }

    const delay = randomDelayMs(
      config.worker.request_delay_min_ms,
      config.worker.request_delay_max_ms,
    );
    await sleep(delay);
  }

  logActivity(null, "info", "Worker finalizado", {
    inserted: totalInserted,
    skipped: totalSkipped,
    proposals: totalProposals,
  });
}
