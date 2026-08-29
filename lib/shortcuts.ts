import type { TrackingStatus } from "@/lib/types";

export const STATUS_SHORTCUTS: Record<string, TrackingStatus> = {
  "1": "enviada",
  "2": "respondeu",
  "3": "fechou",
  "4": "descartada",
};

export const SHORTCUT_HELP = [
  { keys: "j / k", action: "Navegar na lista" },
  { keys: "c", action: "Copiar proposta" },
  { keys: "o", action: "Abrir projeto" },
  { keys: "x", action: "Descartar" },
  { keys: "1–4", action: "Status: enviada, respondeu, fechou, descartada" },
  { keys: "?", action: "Mostrar/ocultar atalhos" },
];

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function resolveStatusShortcut(key: string): TrackingStatus | null {
  return STATUS_SHORTCUTS[key] ?? null;
}
