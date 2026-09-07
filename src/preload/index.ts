import { contextBridge, ipcRenderer } from "electron";
import type { AgentRuntimeEvent } from "../shared/agent-events";
import { ipcChannels, type AgentScopeApi } from "../shared/ipc-contract";

const api: AgentScopeApi = {
  getCurrentSession: () => ipcRenderer.invoke(ipcChannels.getCurrentSession),
  readMarkdownPreview: (path) => ipcRenderer.invoke(ipcChannels.readMarkdownPreview, path),
  onAgentEvent: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: AgentRuntimeEvent) => {
      listener(payload);
    };

    ipcRenderer.on(ipcChannels.agentEvent, handler);
    return () => ipcRenderer.off(ipcChannels.agentEvent, handler);
  },
};

contextBridge.exposeInMainWorld("agentScope", api);
