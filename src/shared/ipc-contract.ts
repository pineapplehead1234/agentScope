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

export type RuntimeStateView = {
  isStreaming: boolean;
  isIdle: boolean;
  isCompacting: boolean;
  sessionId: string;
  sessionFile: string | undefined;
  sessionName: string | undefined;
};

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export type RuntimeMessageView = {
  role: string;
  content: JsonValue;
};

export type SessionStatsView = {
  tokens?: { total?: number };
  cost?: number;
  contextUsage?: { percent?: number };
};

export type AgentScopeApi = {
  getCurrentSession: () => Promise<WorkspaceSessionView>;
  readMarkdownPreview: (path: string) => Promise<MarkdownPreviewData>;
  prompt: (text: string) => Promise<void>;
  abort: () => Promise<void>;
  newSession: () => Promise<{ cancelled: boolean }>;
  switchSession: (sessionPath: string) => Promise<{ cancelled: boolean }>;
  getState: () => Promise<RuntimeStateView>;
  getMessages: () => Promise<RuntimeMessageView[]>;
  getSessionStats: () => Promise<SessionStatsView>;
  onAgentEvent: (listener: (event: AgentRuntimeEvent) => void) => () => void;
};

export const ipcChannels = {
  getCurrentSession: "agentscope:session:get-current",
  readMarkdownPreview: "agentscope:file-preview:read-markdown",
  prompt: "agentscope:runtime:prompt",
  abort: "agentscope:runtime:abort",
  newSession: "agentscope:runtime:new-session",
  switchSession: "agentscope:runtime:switch-session",
  getState: "agentscope:runtime:get-state",
  getMessages: "agentscope:runtime:get-messages",
  getSessionStats: "agentscope:runtime:get-session-stats",
  agentEvent: "agentscope:agent:event",
} as const;
