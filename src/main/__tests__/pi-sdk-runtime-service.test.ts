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

  it("creates a new session and notifies replacement listeners", async () => {
    const newSession = vi.fn(async () => ({ cancelled: false }));
    const listener = vi.fn();
    const service = createPiSdkRuntimeService("D:/myproject/agentScope", {
      createHandle: async () =>
        ({ runtime: { newSession } } as unknown as PiSdkRuntimeHandle),
    });

    service.onSessionReplaced(listener);
    await service.newSession();

    expect(newSession).toHaveBeenCalled();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("switches sessions and notifies replacement listeners", async () => {
    const switchSession = vi.fn(async () => ({ cancelled: false }));
    const listener = vi.fn();
    const service = createPiSdkRuntimeService("D:/myproject/agentScope", {
      createHandle: async () =>
        ({ runtime: { switchSession } } as unknown as PiSdkRuntimeHandle),
    });

    service.onSessionReplaced(listener);
    await service.switchSession("D:/sessions/target.jsonl");

    expect(switchSession).toHaveBeenCalledWith("D:/sessions/target.jsonl");
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
