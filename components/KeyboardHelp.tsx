"use client";

import { Keyboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SHORTCUT_HELP } from "@/lib/shortcuts";

interface KeyboardHelpProps {
  visible: boolean;
  onToggle: () => void;
}

export function KeyboardHelp({ visible, onToggle }: KeyboardHelpProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Atalhos: <kbd className="rounded border px-1">j</kbd>/
          <kbd className="rounded border px-1">k</kbd> navegar ·{" "}
          <kbd className="rounded border px-1">c</kbd> copiar ·{" "}
          <kbd className="rounded border px-1">o</kbd> abrir ·{" "}
          <kbd className="rounded border px-1">x</kbd> descartar ·{" "}
          <kbd className="rounded border px-1">1-4</kbd> status
        </p>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1 text-xs"
          onClick={onToggle}
        >
          <Keyboard className="h-3.5 w-3.5" />
          {visible ? "Ocultar" : "?"}
        </Button>
      </div>

      {visible && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {SHORTCUT_HELP.map((item) => (
              <div
                key={item.keys}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <kbd className="rounded border border-border bg-background px-2 py-0.5 font-mono">
                  {item.keys}
                </kbd>
                <span className="text-muted-foreground">{item.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
