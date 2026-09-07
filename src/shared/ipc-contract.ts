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
  onAgentEvent: (listener: (event: AgentRuntimeEvent) => void) => () => void;
};

export const ipcChannels = {
  getCurrentSession: "agentscope:session:get-current",
  readMarkdownPreview: "agentscope:file-preview:read-markdown",
  agentEvent: "agentscope:agent:event",
} as const;
