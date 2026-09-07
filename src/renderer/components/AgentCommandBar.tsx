import { type FormEvent, useState } from "react";

export function AgentCommandBar() {
  const [promptText, setPromptText] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = promptText.trim();

    if (text) {
      void window.agentScope?.prompt(text);
      setPromptText("");
    }
  }

  return (
    <form className="mt-6 flex gap-2" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="agent-prompt">
        Agent prompt
      </label>
      <input
        id="agent-prompt"
        className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
        value={promptText}
        onChange={(event) => setPromptText(event.target.value)}
        placeholder="Send a prompt to Pi SDK"
      />
      <button
        className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950"
        type="submit"
      >
        Send
      </button>
      <button
        className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200"
        type="button"
        onClick={() => void window.agentScope?.abort()}
      >
        Abort
      </button>
    </form>
  );
}
