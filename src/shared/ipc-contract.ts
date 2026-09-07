import type { AgentRuntimeEvent } from "./agent-events";

export type WorkspaceSessionView = {
  id: string;
  filePath: string;
  workspacePath: string;
  title: string;
  summary: string;
  isCurrent: boolean;
};

export type AgentScopeApi = {
  getCurrentSession: () => Promise<WorkspaceSessionView>;
  onAgentEvent: (listener: (event: AgentRuntimeEvent) => void) => () => void;
};

export const ipcChannels = {
  getCurrentSession: "agentscope:session:get-current",
  agentEvent: "agentscope:agent:event",
} as const;
