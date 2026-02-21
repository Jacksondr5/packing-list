import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("mobile interaction states", () => {
  it("uses stronger touch/focus styles for checklist rows", () => {
    const source = read("src/components/PackingChecklist.tsx");

    expect(source).toContain("focus-visible:ring-2");
    expect(source).toContain("active:bg-accent/80");
  });

  it("uses active/focus states on tappable cards", () => {
    const home = read("src/app/page.tsx");
    const settings = read("src/app/settings/page.tsx");

    expect(home).toContain("group-active:scale-[0.98]");
    expect(settings).toContain("focus-visible:ring-2");
  });
});
