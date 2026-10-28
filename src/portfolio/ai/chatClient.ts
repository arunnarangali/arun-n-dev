import type { ChatMode } from "./systemPrompt";
import type { JobSearchResult } from "./jobs";
import type { CoverLetterTarget } from "./coverLetter";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  // Set on job finder answers; `content` then holds a one-line summary for the model.
  jobs?: JobSearchResult;
  // Set on cover letters drafted from a job card; enables "Send now".
  coverLetter?: CoverLetterTarget;
  // Tracker message from /applied; the model gets it as a list of applications.
  applications?: true;
  // The answer was stopped or failed mid-stream.
  incomplete?: true;
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
  // Seconds until the server accepts the request again, when it says so.
  retryAfter: number;
  // True when Ollama's web-search quota ran out, which blocks every search; false for
  // limits that only apply to this visitor.
  quota: boolean;
  constructor(message: string, status: number, retryAfter = 0, quota = false) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
    this.quota = quota;
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

// Turns a failed response into a ChatRequestError, keeping the Worker's message and
// any retry details.
const requestError = async (response: Response) => {
  let message = `Chat is unavailable right now (${response.status}).`;
  let retryAfter = 0;
  let quota = false;
  try {
    const data = (await response.json()) as {
      error?: string;
      retryAfter?: number;
      quota?: boolean;
    };
    if (data.error) message = data.error;
    if (typeof data.retryAfter === "number") retryAfter = data.retryAfter;
    quota = data.quota === true;
  } catch {
    // Non-JSON error page, e.g. no chat backend on a static host.
  }
  return new ChatRequestError(message, response.status, retryAfter, quota);
};

// Owner only: searches the web for openings and returns structured listings.
export const findJobs = async ({
  query,
  passcode,
  fresh = false,
  signal,
}: {
  query: string;
  passcode: string;
  fresh?: boolean;
  signal?: AbortSignal;
}): Promise<JobSearchResult> => {
  if (!CHAT_API_URL)
    throw new ChatRequestError("Chat isn't set up on this site yet.", 503);
  const response = await fetch(CHAT_API_URL, {
    method: "POST",
    headers: requestHeaders(passcode),
    body: JSON.stringify({ jobs: fresh ? { query, fresh } : { query } }),
    signal,
  });
  if (!response.ok) throw await requestError(response);
  return (await response.json()) as JobSearchResult;
};

export type HrEmailResult = { email: string; source: string; cached?: boolean };

// Owner only: one web search for the company's HR/careers address.
export const findHrEmail = async ({
  company,
  passcode,
}: {
  company: string;
  passcode: string;
}): Promise<HrEmailResult> => {
  if (!CHAT_API_URL)
    throw new ChatRequestError("Chat isn't set up on this site yet.", 503);
  const response = await fetch(CHAT_API_URL, {
    method: "POST",
    headers: requestHeaders(passcode),
    body: JSON.stringify({ hrEmail: { company } }),
  });
  if (!response.ok) throw await requestError(response);
  return (await response.json()) as HrEmailResult;
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

  if (!response.ok || !response.body) throw await requestError(response);

  yield* parseNdjsonStream(response.body);
}
