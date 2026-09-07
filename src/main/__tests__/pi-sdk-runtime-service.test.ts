import { describe, expect, it } from "vitest";
import { createPiSdkRuntimeService } from "../pi-sdk-runtime-service";

describe("PiSdkRuntimeService", () => {
  it("creates a main-process runtime service for a workspace", () => {
    const service = createPiSdkRuntimeService("D:/myproject/agentScope");

    expect(service.cwd).toBe("D:/myproject/agentScope");
    expect(service.create).toEqual(expect.any(Function));
    expect(service.sessionManager).toEqual(expect.any(Object));
  });
});
