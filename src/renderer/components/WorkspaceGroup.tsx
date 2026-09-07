import type { WorkspaceSessionView } from "../../shared/ipc-contract";
import { SessionListItem } from "./SessionListItem";

export function WorkspaceGroup(props: {
  workspacePath: string;
  sessions: WorkspaceSessionView[];
}) {
  return (
    <section className="space-y-2">
      <h3 className="break-all text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {props.workspacePath}
      </h3>
      <div className="space-y-2">
        {props.sessions.map((session) => (
          <SessionListItem key={session.id} session={session} />
        ))}
      </div>
    </section>
  );
}
