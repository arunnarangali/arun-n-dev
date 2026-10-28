import type { ChatMode } from "./systemPrompt";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

// Paste your Cloudflare Worker URL here after `npx wrangler deploy` (see worker/README.md),
// e.g. 'https://arun-portfolio-chat.<your-subdomain>.workers.dev/'.
const PRODUCTION_CHAT_URL = "";

// In dev the Vite server answers `/api/chat` (see vite.config.ts).
export const CHAT_API_URL = import.meta.env.DEV
  ? "/api/chat"
  : PRODUCTION_CHAT_URL;

export class ChatRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type OllamaChunk = {
  message?: { content?: string; thinking?: string };
  done?: boolean;
  error?: string;
};

export type StreamEvent =
  | { type: "token"; text: string }
  | { type: "thinking" }
  | { type: "done" };

// Splits an NDJSON byte stream into parsed events. Handles lines split across chunks.
export async function* parseNdjsonStream(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<StreamEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const parseLine = (line: string): StreamEvent[] => {
    const trimmed = line.trim();
    if (!trimmed) return [];
    const chunk = JSON.parse(trimmed) as OllamaChunk;
    if (chunk.error) throw new ChatRequestError(chunk.error, 502);
    const events: StreamEvent[] = [];
    if (chunk.message?.thinking) events.push({ type: "thinking" });
    if (chunk.message?.content)
      events.push({ type: "token", text: chunk.message.content });
    if (chunk.done) events.push({ type: "done" });
    return events;
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) yield* parseLine(line);
  }
  buffer += decoder.decode();
  yield* parseLine(buffer);
}

type StreamChatOptions = {
  messages: Pick<ChatMessage, "role" | "content">[];
  mode: ChatMode;
  passcode?: string;
  signal?: AbortSignal;
};

const requestHeaders = (passcode?: string): Record<string, string> =>
  passcode
    ? { "Content-Type": "application/json", "X-Owner-Passcode": passcode }
    : { "Content-Type": "application/json" };

export type VerifyResult = "granted" | "denied" | "rate-limited" | "offline";

// Asks the server whether the passcode is the owner's. Does not call the model.
export const verifyOwner = async (passcode: string): Promise<VerifyResult> => {
  if (!CHAT_API_URL) return "offline";
  try {
    const response = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: requestHeaders(passcode),
      body: JSON.stringify({ verify: true }),
    });
    if (response.ok) return "granted";
    if (response.status === 429) return "rate-limited";
    return response.status === 403 ? "denied" : "offline";
  } catch {
    return "offline";
  }
};

export async function* streamChat({
  messages,
  mode,
  passcode,
  signal,
}: StreamChatOptions) {
  if (!CHAT_API_URL)
    throw new ChatRequestError("Chat isn't set up on this site yet.", 503);
  const response = await fetch(CHAT_API_URL, {
    method: "POST",
    headers: requestHeaders(mode === "owner" ? passcode : undefined),
    body: JSON.stringify({
      mode,
      messages: messages.map(({ role, content }) => ({ role, content })),
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    let message = `Chat is unavailable right now (${response.status}).`;
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // Non-JSON error page, e.g. no chat backend on a static host.
    }
    throw new ChatRequestError(message, response.status);
  }

  yield* parseNdjsonStream(response.body);
}
