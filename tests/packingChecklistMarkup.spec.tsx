// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PackingChecklist from "../src/components/PackingChecklist";

vi.mock("convex/react", () => ({
  useMutation: () => vi.fn(),
}));

describe("PackingChecklist markup", () => {
  it("renders checklist rows as buttons", () => {
    render(
      <PackingChecklist
        items={[
          {
            _id: "tripItem1" as never,
            itemName: "Shirt",
            category: "Clothing",
            quantity: 2,
            packed: false,
          },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: /shirt/i })).not.toBeNull();
  });

  it("disables checklist rows when read only", () => {
    render(
      <PackingChecklist
        items={[
          {
            _id: "tripItem1" as never,
            itemName: "Passport",
            category: "Documents",
            quantity: 1,
            packed: true,
          },
        ]}
        readOnly
      />,
    );

    expect(
      screen.getByRole("button", { name: /passport/i }).hasAttribute("disabled"),
    ).toBe(true);
  });
});
