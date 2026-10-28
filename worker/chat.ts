// Chat proxy. ollama.com blocks browser requests, and the API key must stay secret,
// so the chat panel talks to this instead. It runs as a Cloudflare Worker in production
// (default export below) and inside the Vite dev server (`vite.config.ts`).
import {
  buildSystemPrompt,
  type ChatMode,
} from "../src/portfolio/ai/systemPrompt";

export type ChatEnv = {
  OLLAMA_API_KEY?: string;
  // Unlocks owner mode. Owner mode is disabled when it isn't set.
  OWNER_PASSCODE?: string;
};

type IncomingMessage = { role: "user" | "assistant"; content: string };

// gpt-oss:20b is the smallest Ollama Cloud model, so it uses the least of the free plan's limits.
const OLLAMA_URL = "https://ollama.com/api/chat";
const OLLAMA_MODEL = "gpt-oss:20b";

const ALLOWED_ORIGINS = [
  "https://arunnarangali.github.io",
  "http://localhost:5173",
];

const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 4000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 12;

// Best-effort, per-instance limiter. Good enough to stop casual quota abuse.
const hits = new Map<string, number[]>();

export const isRateLimited = (key: string, now = Date.now()) => {
  const recent = (hits.get(key) ?? []).filter(
    (time) => now - time < RATE_LIMIT_WINDOW_MS,
  );
  recent.push(now);
  hits.set(key, recent);
  return recent.length > RATE_LIMIT_MAX;
};

const corsHeaders = (origin: string | null): Record<string, string> => {
  return {
    "Access-Control-Allow-Origin":
      origin && ALLOWED_ORIGINS.includes(origin) ? origin : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Owner-Passcode",
    Vary: "Origin",
  };
};

const json = (status: number, body: unknown, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });

const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1)
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
};

const isOwner = (request: Request, env: ChatEnv) =>
  Boolean(env.OWNER_PASSCODE) &&
  safeEqual(
    request.headers.get("X-Owner-Passcode") ?? "",
    env.OWNER_PASSCODE ?? "",
  );

export const parseMessages = (value: unknown): IncomingMessage[] | null => {
  if (!Array.isArray(value) || value.length === 0) return null;
  const messages = value.slice(-MAX_MESSAGES);
  const valid = messages.every(
    (message) =>
      message &&
      (message.role === "user" || message.role === "assistant") &&
      typeof message.content === "string" &&
      message.content.length <= MAX_MESSAGE_CHARS,
  );
  if (!valid || messages[messages.length - 1].role !== "user") return null;
  return messages.map(({ role, content }) => ({ role, content }));
};

export const handleChatRequest = async (
  request: Request,
  env: ChatEnv,
  clientId = "anonymous",
) => {
  const headers = corsHeaders(request.headers.get("Origin"));

  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers });
  if (request.method !== "POST")
    return json(405, { error: "Method not allowed" }, headers);
  if (
    request.headers.get("Origin") &&
    !headers["Access-Control-Allow-Origin"]
  ) {
    return json(403, { error: "Origin not allowed" }, headers);
  }
  if (isRateLimited(clientId))
    return json(
      429,
      { error: "Too many messages. Please wait a minute." },
      headers,
    );

  let body: { mode?: unknown; messages?: unknown; verify?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json(400, { error: "Invalid JSON body" }, headers);
  }

  // Owner check only, used by the verification screen. Never reaches Ollama.
  if (body.verify === true) {
    return isOwner(request, env)
      ? json(200, { ok: true }, headers)
      : json(403, { error: "Access denied." }, headers);
  }

  const mode: ChatMode = body.mode === "owner" ? "owner" : "public";
  if (mode === "owner" && !isOwner(request, env))
    return json(403, { error: "Access denied." }, headers);
  if (!env.OLLAMA_API_KEY)
    return json(
      500,
      { error: "Chat is not configured (missing OLLAMA_API_KEY)." },
      headers,
    );

  const messages = parseMessages(body.messages);
  if (!messages) return json(400, { error: "Invalid messages" }, headers);

  const upstream = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OLLAMA_API_KEY}`,
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: true,
      messages: [
        { role: "system", content: buildSystemPrompt(mode) },
        ...messages,
      ],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    return json(
      502,
      {
        error:
          `Model request failed (${upstream.status}). ${detail.slice(0, 200)}`.trim(),
      },
      headers,
    );
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      ...headers,
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-store",
    },
  });
};

export default {
  fetch(request: Request, env: ChatEnv) {
    return handleChatRequest(
      request,
      env,
      request.headers.get("CF-Connecting-IP") ?? "anonymous",
    );
  },
};
