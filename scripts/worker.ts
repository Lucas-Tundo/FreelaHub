import cron from "node-cron";

import { logActivity } from "@/lib/activity-log";
import { loadConfig } from "@/lib/config";
import { closeDb } from "@/lib/db";
import { runWorkerCycle } from "@/lib/worker-cycle";

async function main(): Promise<void> {
  const runOnce = process.argv.includes("--once");
  const config = loadConfig();

  if (runOnce) {
    await runWorkerCycle();
    closeDb();
    return;
  }

  const freelancerCron =
    config.platforms.freelancer?.cron ?? process.env.WORKER_CRON ?? "*/15 * * * *";

  if (!cron.validate(freelancerCron)) {
    throw new Error(`CRON inválido: ${freelancerCron}`);
  }

  console.log(`Worker agendado: ${freelancerCron}`);

  await runWorkerCycle();

  cron.schedule(freelancerCron, () => {
    void runWorkerCycle();
  });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  logActivity(null, "error", `Worker encerrado com erro: ${message}`, {
    stack: error instanceof Error ? error.stack : undefined,
  });
  console.error(message);
  closeDb();
  process.exit(1);
});
