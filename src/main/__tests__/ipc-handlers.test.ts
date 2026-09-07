import { describe, expect, it, vi } from "vitest";
import { ipcChannels } from "../../shared/ipc-contract";
import { registerIpcHandlers } from "../ipc-handlers";

describe("registerIpcHandlers", () => {
  it("replaces any existing current-session handler before registration", () => {
    const ipcMain = {
      handle: vi.fn(),
      removeHandler: vi.fn(),
    };
    const workspaceSessionService = {
      getCurrentSession: vi.fn(),
    };

    registerIpcHandlers({ ipcMain, workspaceSessionService });

    expect(ipcMain.removeHandler).toHaveBeenCalledWith(ipcChannels.getCurrentSession);
    expect(ipcMain.handle).toHaveBeenCalledWith(
      ipcChannels.getCurrentSession,
      expect.any(Function),
    );
  });
});
