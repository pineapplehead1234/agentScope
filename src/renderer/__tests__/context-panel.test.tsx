import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContextPanel } from "../components/ContextPanel";

describe("ContextPanel", () => {
  it("renders token and cost stats", () => {
    render(
      <ContextPanel
        stats={{
          tokenUsage: 12000,
          cost: 0.42,
          contextUsagePercent: 61,
          isCompacting: false,
          summary: "Reduced context",
        }}
      />,
    );

    expect(screen.getByText("12000")).toBeInTheDocument();
    expect(screen.getByText("0.42")).toBeInTheDocument();
  });
});
