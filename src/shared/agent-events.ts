export type AgentRuntimeEvent =
  | { type: "agent_start" }
  | { type: "agent_settled" }
  | {
      type: "message_update";
      assistantMessageEvent: { type: "text_delta"; delta: string };
    }
  | { type: "tool_execution_start"; toolCallId: string; toolName: string }
  | {
      type: "tool_execution_end";
      toolCallId: string;
      toolName: string;
      isError: boolean;
    };
