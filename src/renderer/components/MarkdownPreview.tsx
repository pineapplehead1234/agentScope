export function MarkdownPreview(props: { path: string; content: string }) {
  return (
    <section className="mt-6 border-t border-zinc-800 pt-5">
      <h2 className="text-sm font-semibold text-zinc-100">Markdown Preview</h2>
      <div className="mt-2 break-all text-xs text-zinc-500">{props.path}</div>
      <article className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
        {props.content}
      </article>
    </section>
  );
}
