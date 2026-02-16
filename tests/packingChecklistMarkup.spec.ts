import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("PackingChecklist markup", () => {
  it("does not render checklist rows as <button> wrappers", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/PackingChecklist.tsx"),
      "utf8",
    );

    expect(source).not.toContain("<button");
  });
});
