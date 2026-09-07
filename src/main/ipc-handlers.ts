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
  piSdkRuntimeService?: Pick<PiSdkRuntimeService, "prompt" | "abort">;
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
  }
}
