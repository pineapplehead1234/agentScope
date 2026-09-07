import type { AgentTimelineState } from "../state/agent-event-reducer";
import { ThinkingBlock } from "./ThinkingBlock";
import { ToolCard } from "./ToolCard";

export function RunTimeline(props: { state: AgentTimelineState }) {
  return (
    <section className="min-w-0 px-6 py-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-zinc-100">Run Timeline</h2>
        <span className="text-xs text-zinc-500">
          {props.state.isRunning ? "Running" : "Idle"}
        </span>
      </div>
      <div className="mt-6 space-y-4">
        {props.state.messages.map((message, index) => (
          <ThinkingBlock key={`${message.role}-${index}`}>{message.content}</ThinkingBlock>
        ))}
        {props.state.runningTools.map((tool) => (
          <ToolCard key={tool.id} toolName={tool.toolName} status={tool.status} />
        ))}
      </div>
    </section>
  );
}
