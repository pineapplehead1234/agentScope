export function ThinkingBlock(props: { children: string }) {
  return (
    <blockquote className="border-l border-amber-300/40 pl-3 text-sm leading-6 text-zinc-300">
      {props.children}
    </blockquote>
  );
}
