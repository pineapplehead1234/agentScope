import { contextBridge, ipcRenderer } from "electron";
import type { AgentRuntimeEvent } from "../shared/agent-events";
import { ipcChannels, type AgentScopeApi } from "../shared/ipc-contract";

const api: AgentScopeApi = {
  getCurrentSession: () => ipcRenderer.invoke(ipcChannels.getCurrentSession),
  readMarkdownPreview: (path) => ipcRenderer.invoke(ipcChannels.readMarkdownPreview, path),
  prompt: (text) => ipcRenderer.invoke(ipcChannels.prompt, text),
  abort: () => ipcRenderer.invoke(ipcChannels.abort),
  newSession: () => ipcRenderer.invoke(ipcChannels.newSession),
  switchSession: (sessionPath) => ipcRenderer.invoke(ipcChannels.switchSession, sessionPath),
  getState: () => ipcRenderer.invoke(ipcChannels.getState),
  getMessages: () => ipcRenderer.invoke(ipcChannels.getMessages),
  getSessionStats: () => ipcRenderer.invoke(ipcChannels.getSessionStats),
  onAgentEvent: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: AgentRuntimeEvent) => {
      listener(payload);
    };

    ipcRenderer.on(ipcChannels.agentEvent, handler);
    return () => ipcRenderer.off(ipcChannels.agentEvent, handler);
  },
};

contextBridge.exposeInMainWorld("agentScope", api);
