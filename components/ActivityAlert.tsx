"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

interface ActivityEntry {
  id: number;
  platform: string | null;
  level: "info" | "warn" | "error";
  message: string;
  created_at: string;
}

interface ActivityAlertProps {
  refreshKey?: number;
}

export function ActivityAlert({ refreshKey = 0 }: ActivityAlertProps) {
  const [errors, setErrors] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    void fetch("/api/activity?errors=true&limit=3")
      .then((res) => res.json())
      .then((data: ActivityEntry[]) => setErrors(data))
      .catch(() => {
        // silencioso — alerta é opcional
      });
  }, [refreshKey]);

  if (errors.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      {errors.map((entry) => (
        <div
          key={entry.id}
          className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">
              {entry.platform ? `[${entry.platform}] ` : ""}
              {entry.message}
            </p>
            <p className="text-xs text-red-400/70">{entry.created_at}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
