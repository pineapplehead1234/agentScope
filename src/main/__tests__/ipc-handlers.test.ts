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

  it("registers markdown preview through the file preview service", () => {
    const ipcMain = {
      handle: vi.fn(),
      removeHandler: vi.fn(),
    };
    const workspaceSessionService = {
      getCurrentSession: vi.fn(),
    };
    const filePreviewService = {
      readMarkdownPreview: vi.fn(),
    };

    registerIpcHandlers({ ipcMain, workspaceSessionService, filePreviewService });

    expect(ipcMain.removeHandler).toHaveBeenCalledWith(ipcChannels.readMarkdownPreview);
    expect(ipcMain.handle).toHaveBeenCalledWith(
      ipcChannels.readMarkdownPreview,
      expect.any(Function),
    );
  });

  it("registers prompt and abort runtime commands", () => {
    const ipcMain = {
      handle: vi.fn(),
      removeHandler: vi.fn(),
    };
    const workspaceSessionService = {
      getCurrentSession: vi.fn(),
    };
    const piSdkRuntimeService = {
      prompt: vi.fn(),
      abort: vi.fn(),
      newSession: vi.fn(),
      switchSession: vi.fn(),
    };

    registerIpcHandlers({ ipcMain, workspaceSessionService, piSdkRuntimeService });

    expect(ipcMain.handle).toHaveBeenCalledWith(ipcChannels.prompt, expect.any(Function));
    expect(ipcMain.handle).toHaveBeenCalledWith(ipcChannels.abort, expect.any(Function));
    expect(ipcMain.handle).toHaveBeenCalledWith(ipcChannels.newSession, expect.any(Function));
    expect(ipcMain.handle).toHaveBeenCalledWith(ipcChannels.switchSession, expect.any(Function));
  });
});
