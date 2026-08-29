import { runWorkerCycle } from "@/lib/worker-cycle";

let workerPromise: Promise<void> | null = null;
let lastError: string | null = null;
let lastFinishedAt: string | null = null;

export function isWorkerRunning(): boolean {
  return workerPromise !== null;
}

export function getWorkerStatus(): {
  running: boolean;
  lastError: string | null;
  lastFinishedAt: string | null;
} {
  return {
    running: isWorkerRunning(),
    lastError,
    lastFinishedAt,
  };
}

export function startWorkerInBackground(): {
  started: boolean;
  reason?: "already_running";
} {
  if (workerPromise) {
    return { started: false, reason: "already_running" };
  }

  lastError = null;

  workerPromise = runWorkerCycle()
    .then(() => {
      lastFinishedAt = new Date().toISOString();
    })
    .catch((error: unknown) => {
      lastError =
        error instanceof Error ? error.message : "Erro desconhecido no worker";
      throw error;
    })
    .finally(() => {
      workerPromise = null;
    });

  return { started: true };
}
