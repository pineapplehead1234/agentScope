import type { WorkspaceSessionView } from "../../shared/ipc-contract";

export function SessionListItem(props: { session: WorkspaceSessionView }) {
  const shouldShowSummary = props.session.summary !== props.session.title;

  return (
    <article className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="truncate text-sm font-medium text-zinc-100">{props.session.title}</h3>
        {props.session.isCurrent ? (
          <span className="shrink-0 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
            Current
          </span>
        ) : null}
      </div>
      {shouldShowSummary ? (
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-400">
          {props.session.summary}
        </p>
      ) : null}
    </article>
  );
}
