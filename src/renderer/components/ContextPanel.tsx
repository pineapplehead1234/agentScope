import type { ContextStats, MarkdownPreviewState } from "../state/context-store";
import { MarkdownPreview } from "./MarkdownPreview";

export function ContextPanel(props: {
  stats: ContextStats;
  markdownPreview?: MarkdownPreviewState | null;
}) {
  return (
    <aside className="border-l border-zinc-800 bg-zinc-950 px-4 py-5">
      <h2 className="text-base font-semibold text-zinc-100">Context Panel</h2>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
          <dt className="text-xs text-zinc-500">Tokens</dt>
          <dd className="mt-1 font-medium text-zinc-100">{props.stats.tokenUsage}</dd>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
          <dt className="text-xs text-zinc-500">Cost</dt>
          <dd className="mt-1 font-medium text-zinc-100">{props.stats.cost}</dd>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
          <dt className="text-xs text-zinc-500">Context</dt>
          <dd className="mt-1 font-medium text-zinc-100">
            {props.stats.contextUsagePercent}%
          </dd>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
          <dt className="text-xs text-zinc-500">Compaction</dt>
          <dd className="mt-1 font-medium text-zinc-100">
            {props.stats.isCompacting ? "Running" : "Idle"}
          </dd>
        </div>
      </dl>
      <p className="mt-5 text-sm leading-6 text-zinc-400">{props.stats.summary}</p>
      {props.markdownPreview ? (
        <MarkdownPreview path={props.markdownPreview.path} content={props.markdownPreview.content} />
      ) : null}
    </aside>
  );
}
