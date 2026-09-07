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

export type PiSdkRuntimeHandle = {
  runtime: AgentSessionRuntime;
  services: AgentSessionServices;
  sessionManager: SessionManager;
  diagnostics: readonly AgentSessionRuntimeDiagnostic[];
};

export function createPiSdkRuntimeService(cwd: string) {
  const agentDir = getAgentDir();
  const sessionManager = SessionManager.continueRecent(cwd);

  return {
    cwd,
    sessionManager,
    async create(): Promise<PiSdkRuntimeHandle> {
      const runtime = await createAgentSessionRuntime(
        async (options) => {
          const services = await createAgentSessionServices({
            cwd: options.cwd,
            agentDir: options.agentDir,
          });
          const sessionResult = await createAgentSessionFromServices({
            services,
            sessionManager: options.sessionManager,
            sessionStartEvent: options.sessionStartEvent,
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
    },
  };
}
