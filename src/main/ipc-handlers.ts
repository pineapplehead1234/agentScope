import { ipcChannels } from "../shared/ipc-contract";
import type { WorkspaceSessionService } from "./workspace-session-service";

type IpcHandlerRegistry = {
  handle: (...args: Parameters<Electron.IpcMain["handle"]>) => void;
  removeHandler: (channel: string) => void;
};

export function registerIpcHandlers(options: {
  ipcMain: IpcHandlerRegistry;
  workspaceSessionService: WorkspaceSessionService;
}) {
  options.ipcMain.removeHandler(ipcChannels.getCurrentSession);
  options.ipcMain.handle(ipcChannels.getCurrentSession, () => {
    return options.workspaceSessionService.getCurrentSession();
  });
}
