import type { AgentRuntimeEvent } from "./agent-events";

export type WorkspaceSessionView = {
  id: string;
  filePath: string;
  workspacePath: string;
  title: string;
  summary: string;
  isCurrent: boolean;
};

export type MarkdownPreviewData = {
  path: string;
  content: string;
};

export type AgentScopeApi = {
  getCurrentSession: () => Promise<WorkspaceSessionView>;
  readMarkdownPreview: (path: string) => Promise<MarkdownPreviewData>;
  prompt: (text: string) => Promise<void>;
  abort: () => Promise<void>;
  newSession: () => Promise<{ cancelled: boolean }>;
  switchSession: (sessionPath: string) => Promise<{ cancelled: boolean }>;
  onAgentEvent: (listener: (event: AgentRuntimeEvent) => void) => () => void;
};

export const ipcChannels = {
  getCurrentSession: "agentscope:session:get-current",
  readMarkdownPreview: "agentscope:file-preview:read-markdown",
  prompt: "agentscope:runtime:prompt",
  abort: "agentscope:runtime:abort",
  newSession: "agentscope:runtime:new-session",
  switchSession: "agentscope:runtime:switch-session",
  agentEvent: "agentscope:agent:event",
} as const;
