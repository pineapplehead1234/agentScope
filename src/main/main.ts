import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "node:path";
import { forwardAgentEventsToWindow } from "./agent-event-forwarding";
import { createFilePreviewService } from "./file-preview-service";
import { registerIpcHandlers } from "./ipc-handlers";
import { createPiSdkRuntimeService } from "./pi-sdk-runtime-service";
import { createWorkspaceSessionService } from "./workspace-session-service";

const piSdkRuntimeService = createPiSdkRuntimeService(process.cwd());
const workspaceSessionService = createWorkspaceSessionService({
  cwd: process.cwd(),
  sessionManager: piSdkRuntimeService.sessionManager,
});
const filePreviewService = createFilePreviewService({ workspaceRoot: process.cwd() });

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  void piSdkRuntimeService
    .create()
    .then((runtimeHandle) => {
      const unsubscribe = forwardAgentEventsToWindow({ runtimeHandle, window: mainWindow });
      mainWindow.on("closed", unsubscribe);
    })
    .catch((error: unknown) => {
      console.error("Failed to initialize Pi SDK runtime", error);
    });
}

void app.whenReady().then(() => {
  registerIpcHandlers({
    ipcMain,
    workspaceSessionService,
    filePreviewService,
    piSdkRuntimeService,
  });
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
