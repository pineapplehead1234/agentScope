export function ToolCard(props: {
  toolName: string;
  status: "running" | "success" | "error";
}) {
  return (
    <article className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm">
      <div className="font-medium text-zinc-100">{props.toolName}</div>
      <div className="mt-1 text-xs capitalize text-zinc-500">{props.status}</div>
    </article>
  );
}
