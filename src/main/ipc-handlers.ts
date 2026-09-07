import { ipcChannels } from "../shared/ipc-contract";
import type { FilePreviewService } from "./file-preview-service";
import type { WorkspaceSessionService } from "./workspace-session-service";

type IpcHandlerRegistry = {
  handle: (...args: Parameters<Electron.IpcMain["handle"]>) => void;
  removeHandler: (channel: string) => void;
};

export function registerIpcHandlers(options: {
  ipcMain: IpcHandlerRegistry;
  workspaceSessionService: WorkspaceSessionService;
  filePreviewService?: FilePreviewService;
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
}
