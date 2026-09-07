import { describe, expect, it, vi } from "vitest";
import {
  createPiSdkRuntimeService,
  type PiSdkRuntimeHandle,
} from "../pi-sdk-runtime-service";

describe("PiSdkRuntimeService", () => {
  it("creates a main-process runtime service for a workspace", () => {
    const service = createPiSdkRuntimeService("D:/myproject/agentScope");

    expect(service.cwd).toBe("D:/myproject/agentScope");
    expect(service.create).toEqual(expect.any(Function));
    expect(service.sessionManager).toEqual(expect.any(Object));
  });

  it("prompts through the active Pi SDK session", async () => {
    const prompt = vi.fn(async () => undefined);
    const service = createPiSdkRuntimeService("D:/myproject/agentScope", {
      createHandle: async () =>
        ({ runtime: { session: { prompt } } } as unknown as PiSdkRuntimeHandle),
    });

    await service.prompt("Inspect workspace");

    expect(prompt).toHaveBeenCalledWith("Inspect workspace");
  });

  it("aborts through the active Pi SDK session", async () => {
    const abort = vi.fn(async () => undefined);
    const service = createPiSdkRuntimeService("D:/myproject/agentScope", {
      createHandle: async () =>
        ({ runtime: { session: { abort } } } as unknown as PiSdkRuntimeHandle),
    });

    await service.abort();

    expect(abort).toHaveBeenCalled();
  });
});
