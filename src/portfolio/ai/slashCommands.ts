export type SlashCommand = {
  name: string;
  description: string;
  // Prompt sent to the model. Commands without a prompt are handled by the chat panel.
  prompt?: string;
};

export const slashCommands: SlashCommand[] = [
  {
    name: "projects",
    description: "Summarize the projects",
    prompt: "Give me a short overview of the projects in this portfolio.",
  },
  {
    name: "skills",
    description: "List the core skills",
    prompt: "What are the core skills and strongest technologies?",
  },
  {
    name: "experience",
    description: "Walk through work history",
    prompt: "Walk me through the work experience, most recent first.",
  },
  {
    name: "contact",
    description: "How to get in touch",
    prompt: "How can I get in touch?",
  },
  { name: "jobs", description: "Find job openings that fit you (owner)" },
  {
    name: "applied",
    description: "Jobs you applied to, with CSV export (owner)",
  },
  { name: "clear", description: "Start a new chat" },
  { name: "owner", description: "Unlock owner mode (JARVIS)" },
  { name: "public", description: "Lock owner mode" },
];

export type ParsedInput =
  | { kind: "prompt"; text: string }
  | { kind: "command"; name: string; args?: string };

// Turns `/skills` into its prompt, `/skills react` into the prompt plus extra text,
// and leaves panel actions like `/clear` for the caller.
export const parseChatInput = (raw: string): ParsedInput => {
  const text = raw.trim();
  const match = /^\/(\w+)\s*(.*)$/s.exec(text);
  if (!match) return { kind: "prompt", text };
  const command = slashCommands.find(
    (entry) => entry.name === match[1].toLowerCase(),
  );
  if (!command) return { kind: "prompt", text };
  const extra = match[2].trim();
  if (!command.prompt)
    return extra
      ? { kind: "command", name: command.name, args: extra }
      : { kind: "command", name: command.name };
  return {
    kind: "prompt",
    text: extra ? `${command.prompt} ${extra}` : command.prompt,
  };
};

export const matchSlashCommands = (raw: string) => {
  const match = /^\/(\w*)$/.exec(raw.trim());
  if (!match) return [];
  return slashCommands.filter((entry) =>
    entry.name.startsWith(match[1].toLowerCase()),
  );
};
