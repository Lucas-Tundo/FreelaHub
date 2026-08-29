import { describe, expect, it } from "vitest";

import { resolveStatusShortcut } from "@/lib/shortcuts";

describe("resolveStatusShortcut", () => {
  it("mapeia teclas 1-4 para status", () => {
    expect(resolveStatusShortcut("1")).toBe("enviada");
    expect(resolveStatusShortcut("2")).toBe("respondeu");
    expect(resolveStatusShortcut("3")).toBe("fechou");
    expect(resolveStatusShortcut("4")).toBe("descartada");
    expect(resolveStatusShortcut("5")).toBeNull();
  });
});
