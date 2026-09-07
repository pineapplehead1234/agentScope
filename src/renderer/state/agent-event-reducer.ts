import type { AgentRuntimeEvent } from "../../shared/agent-events";

export type AgentTimelineState = {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  runningTools: Array<{
    id: string;
    toolName: string;
    status: "running" | "success" | "error";
  }>;
  isRunning: boolean;
};

export const initialAgentTimelineState: AgentTimelineState = {
  messages: [],
  runningTools: [],
  isRunning: false,
};

export function reduceAgentEvent(
  state: AgentTimelineState | undefined,
  event: AgentRuntimeEvent,
): AgentTimelineState {
  const next = state ?? initialAgentTimelineState;

  switch (event.type) {
    case "agent_start":
      return { messages: [], runningTools: [], isRunning: true };
    case "agent_settled":
      return { ...next, isRunning: false };
    case "message_update": {
      const lastMessage = next.messages.at(-1);

      if (lastMessage?.role === "assistant") {
        return {
          ...next,
          messages: [
            ...next.messages.slice(0, -1),
            {
              ...lastMessage,
              content: lastMessage.content + event.assistantMessageEvent.delta,
            },
          ],
        };
      }

      return {
        ...next,
        messages: [
          ...next.messages,
          { role: "assistant", content: event.assistantMessageEvent.delta },
        ],
      };
    }
    case "tool_execution_start":
      return {
        ...next,
        runningTools: [
          ...next.runningTools,
          { id: event.toolCallId, toolName: event.toolName, status: "running" },
        ],
      };
    case "tool_execution_end":
      return {
        ...next,
        runningTools: next.runningTools.map((tool) =>
          tool.id === event.toolCallId
            ? { ...tool, status: event.isError ? "error" : "success" }
            : tool,
        ),
      };
  }
}
