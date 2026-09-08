import {
  createAgentSessionFromServices,
  createAgentSessionRuntime,
  createAgentSessionServices,
  getAgentDir,
  SessionManager,
  type AgentSessionRuntime,
  type AgentSessionRuntimeDiagnostic,
  type AgentSessionServices,
} from "@earendil-works/pi-coding-agent";
import type {
  JsonValue,
  RuntimeMessageView,
  RuntimeStateView,
  SessionStatsView,
} from "../shared/ipc-contract";

export type PiSdkRuntimeHandle = {
  runtime: AgentSessionRuntime;
  services: AgentSessionServices;
  sessionManager: SessionManager;
  diagnostics: readonly AgentSessionRuntimeDiagnostic[];
};

function toJsonView(value: unknown): RuntimeMessageView {
  const serialized = JSON.stringify(value);
  const parsed = serialized === undefined ? null : (JSON.parse(serialized) as JsonValue);

  if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
    const role = parsed.role;
    if (typeof role === "string") {
      return {
        role,
        content: "content" in parsed ? parsed.content : null,
      };
    }
  }

  return { role: "unknown", content: parsed };
}

export function createPiSdkRuntimeService(
  cwd: string,
  options: { createHandle?: () => Promise<PiSdkRuntimeHandle> } = {},
) {
  const agentDir = getAgentDir();
  const sessionManager = SessionManager.continueRecent(cwd);
  let currentHandle: PiSdkRuntimeHandle | undefined;
  const sessionReplacementListeners = new Set<() => void>();

  async function createDefaultHandle(): Promise<PiSdkRuntimeHandle> {
    const runtime = await createAgentSessionRuntime(
      async (runtimeOptions) => {
        const services = await createAgentSessionServices({
          cwd: runtimeOptions.cwd,
          agentDir: runtimeOptions.agentDir,
        });
        const sessionResult = await createAgentSessionFromServices({
          services,
          sessionManager: runtimeOptions.sessionManager,
          sessionStartEvent: runtimeOptions.sessionStartEvent,
        });

        return {
          ...sessionResult,
          services,
          diagnostics: services.diagnostics,
        };
      },
      { cwd, agentDir, sessionManager },
    );

    return {
      runtime,
      services: runtime.services,
      sessionManager,
      diagnostics: runtime.diagnostics,
    };
  }

  async function getHandle() {
    currentHandle ??= await (options.createHandle ?? createDefaultHandle)();
    return currentHandle;
  }

  function notifySessionReplaced() {
    for (const listener of sessionReplacementListeners) {
      listener();
    }
  }

  return {
    cwd,
    sessionManager,
    async create(): Promise<PiSdkRuntimeHandle> {
      return getHandle();
    },
    async prompt(text: string): Promise<void> {
      const handle = await getHandle();
      await handle.runtime.session.prompt(text);
    },
    async abort(): Promise<void> {
      const handle = await getHandle();
      await handle.runtime.session.abort();
    },
    async newSession(): Promise<{ cancelled: boolean }> {
      const handle = await getHandle();
      const result = await handle.runtime.newSession();

      if (!result.cancelled) {
        notifySessionReplaced();
      }

      return result;
    },
    async switchSession(sessionPath: string): Promise<{ cancelled: boolean }> {
      const handle = await getHandle();
      const result = await handle.runtime.switchSession(sessionPath);

      if (!result.cancelled) {
        notifySessionReplaced();
      }

      return result;
    },
    onSessionReplaced(listener: () => void) {
      sessionReplacementListeners.add(listener);

      return () => {
        sessionReplacementListeners.delete(listener);
      };
    },
    async getState(): Promise<RuntimeStateView> {
      const handle = await getHandle();
      const session = handle.runtime.session;

      return {
        isStreaming: session.isStreaming,
        isIdle: session.isIdle,
        isCompacting: session.isCompacting,
        sessionId: session.sessionId,
        sessionFile: session.sessionFile,
        sessionName: session.sessionName,
      };
    },
    async getMessages(): Promise<RuntimeMessageView[]> {
      const handle = await getHandle();
      return handle.runtime.session.messages.map(toJsonView);
    },
    async getSessionStats(): Promise<SessionStatsView> {
      const handle = await getHandle();
      const stats = handle.runtime.session.getSessionStats();

      return {
        tokens: { total: stats.tokens.total },
        cost: stats.cost,
        contextUsage: stats.contextUsage
          ? { percent: stats.contextUsage.percent ?? undefined }
          : undefined,
      };
    },
  };
}

export type PiSdkRuntimeService = ReturnType<typeof createPiSdkRuntimeService>;
