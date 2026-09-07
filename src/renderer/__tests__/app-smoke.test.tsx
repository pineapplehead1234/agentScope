import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../App";

describe("App", () => {
  it("renders the three-pane shell", () => {
    render(<App />);

    expect(screen.getByText("Workspace Sessions")).toBeInTheDocument();
    expect(screen.getByText("Run Timeline")).toBeInTheDocument();
    expect(screen.getByText("Context Panel")).toBeInTheDocument();
  });
});
