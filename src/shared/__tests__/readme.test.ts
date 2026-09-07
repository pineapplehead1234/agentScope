import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("README", () => {
  it("describes the SDK main thread and three-pane layout", () => {
    const readme = readFileSync("README.md", "utf8");

    expect(readme).toContain("Pi SDK");
    expect(readme).toContain("Workspace Sessions");
    expect(readme).toContain("Run Timeline");
  });
});
