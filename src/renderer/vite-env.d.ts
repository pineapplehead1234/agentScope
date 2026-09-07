/// <reference types="vite/client" />

import type { AgentScopeApi } from "../shared/ipc-contract";

declare global {
  interface Window {
    agentScope?: AgentScopeApi;
  }
}
