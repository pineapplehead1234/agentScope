import { ipcChannels } from "../shared/ipc-contract";
import type { FilePreviewService } from "./file-preview-service";
import type { PiSdkRuntimeService } from "./pi-sdk-runtime-service";
import type { WorkspaceSessionService } from "./workspace-session-service";

type IpcHandlerRegistry = {
  handle: (...args: Parameters<Electron.IpcMain["handle"]>) => void;
  removeHandler: (channel: string) => void;
};

export function registerIpcHandlers(options: {
  ipcMain: IpcHandlerRegistry;
  workspaceSessionService: WorkspaceSessionService;
  filePreviewService?: FilePreviewService;
  piSdkRuntimeService?: Pick<
    PiSdkRuntimeService,
    "prompt" | "abort" | "newSession" | "switchSession"
    | "getState" | "getMessages" | "getSessionStats"
  >;
}) {
  options.ipcMain.removeHandler(ipcChannels.getCurrentSession);
  options.ipcMain.handle(ipcChannels.getCurrentSession, () => {
    return options.workspaceSessionService.getCurrentSession();
  });

  if (options.filePreviewService) {
    options.ipcMain.removeHandler(ipcChannels.readMarkdownPreview);
    options.ipcMain.handle(ipcChannels.readMarkdownPreview, (_event, path: string) => {
      return options.filePreviewService?.readMarkdownPreview(path);
    });
  }

  if (options.piSdkRuntimeService) {
    options.ipcMain.removeHandler(ipcChannels.prompt);
    options.ipcMain.handle(ipcChannels.prompt, (_event, text: string) => {
      return options.piSdkRuntimeService?.prompt(text);
    });

    options.ipcMain.removeHandler(ipcChannels.abort);
    options.ipcMain.handle(ipcChannels.abort, () => {
      return options.piSdkRuntimeService?.abort();
    });

    options.ipcMain.removeHandler(ipcChannels.newSession);
    options.ipcMain.handle(ipcChannels.newSession, () => {
      return options.piSdkRuntimeService?.newSession();
    });

    options.ipcMain.removeHandler(ipcChannels.switchSession);
    options.ipcMain.handle(ipcChannels.switchSession, (_event, sessionPath: string) => {
      return options.piSdkRuntimeService?.switchSession(sessionPath);
    });

    options.ipcMain.removeHandler(ipcChannels.getState);
    options.ipcMain.handle(ipcChannels.getState, () => {
      return options.piSdkRuntimeService?.getState();
    });

    options.ipcMain.removeHandler(ipcChannels.getMessages);
    options.ipcMain.handle(ipcChannels.getMessages, () => {
      return options.piSdkRuntimeService?.getMessages();
    });

    options.ipcMain.removeHandler(ipcChannels.getSessionStats);
    options.ipcMain.handle(ipcChannels.getSessionStats, () => {
      return options.piSdkRuntimeService?.getSessionStats();
    });
  }
}
