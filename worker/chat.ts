// Chat proxy. ollama.com blocks browser requests, and the API key must stay secret,
// so the chat panel talks to this instead. It runs as a Cloudflare Worker in production
// (default export below) and inside the Vite dev server (`vite.config.ts`).
import {
  buildSystemPrompt,
  type ChatMode,
} from "../src/portfolio/ai/systemPrompt";
import {
  MAX_CONTEXT_MESSAGE_CHARS,
  MAX_MESSAGE_CHARS,
  MAX_MESSAGES,
} from "../src/portfolio/ai/chatLimits";
import {
  buildJobQueries,
  formatWait,
  MAX_JOB_QUERY_CHARS,
  pageMentionsDate,
  pickHrEmail,
  sanitizeJobs,
  type JobSearchResult,
} from "../src/portfolio/ai/jobs";

export type ChatEnv = {
  OLLAMA_API_KEY?: string;
  // Unlocks owner mode. Owner mode is disabled when it isn't set.
  OWNER_PASSCODE?: string;
};

type IncomingMessage = { role: "user" | "assistant"; content: string };

// gpt-oss:20b is the smallest Ollama Cloud model, so it uses the least of the free plan's limits.
const OLLAMA_URL = "https://ollama.com/api/chat";
const OLLAMA_MODEL = "gpt-oss:20b";
const OLLAMA_SEARCH_URL = "https://ollama.com/api/web_search";

const ALLOWED_ORIGINS = [
  "https://arunnarangali.github.io",
  "http://localhost:5173",
];

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 12;
// Each job search runs several web searches, so it has its own, tighter limit.
const JOBS_LIMIT_WINDOW_MS = 10 * 60_000;
const JOBS_LIMIT_MAX = 4;
const SEARCH_RESULTS_PER_QUERY = 10;
const SNIPPET_CHARS = 1200;

// Best-effort, per-instance limiter. Good enough to stop casual quota abuse.
const hits = new Map<string, number[]>();

export const isRateLimited = (
  key: string,
  now = Date.now(),
  max = RATE_LIMIT_MAX,
  windowMs = RATE_LIMIT_WINDOW_MS,
) => {
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > max;
};

// Seconds until the oldest request in the window expires, so the client can wait it out.
const rateLimitRetryAfter = (
  key: string,
  windowMs: number,
  now = Date.now(),
) => {
  const oldest = Math.min(...(hits.get(key) ?? [now]));
  return Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
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

export class MessageTooLongError extends Error {}

// Earlier turns that are too long are shortened rather than rejected, so one long
// answer doesn't break every follow-up. Only the new question must fit the limit.
export const parseMessages = (value: unknown): IncomingMessage[] | null => {
  if (!Array.isArray(value) || value.length === 0) return null;
  const messages = value.slice(-MAX_MESSAGES);
  const valid = messages.every(
    (message) =>
      message &&
      (message.role === "user" || message.role === "assistant") &&
      typeof message.content === "string",
  );
  if (!valid || messages[messages.length - 1].role !== "user") return null;
  if (messages[messages.length - 1].content.length > MAX_MESSAGE_CHARS)
    throw new MessageTooLongError(
      `Message is too long (max ${MAX_MESSAGE_CHARS} characters).`,
    );
  return messages.map(({ role, content }: IncomingMessage) => ({
    role,
    content:
      content.length > MAX_CONTEXT_MESSAGE_CHARS
        ? `${content.slice(0, MAX_CONTEXT_MESSAGE_CHARS)}\n…(shortened)`
        : content,
  }));
};

type SearchResult = { title: string; url: string; content: string };

class UpstreamError extends Error {
  status: number;
  retryAfter: number;
  constructor(message: string, status: number, retryAfter = 0) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

const JOBS_CACHE_TTL_MS = 6 * 60 * 60_000;
// Repeat searches within the TTL cost no web-search quota. Per Worker instance.
const jobsCache = new Map<
  string,
  { result: JobSearchResult; expires: number }
>();
// Set when Ollama answers 429, so we stop calling it until the cool-down ends.
let searchBlockedUntil = 0;

const HR_CACHE_TTL_MS = 7 * 24 * 60 * 60_000;
const hrCache = new Map<
  string,
  { result: { email: string; source: string }; expires: number }
>();

export const resetJobSearchState = () => {
  jobsCache.clear();
  hrCache.clear();
  searchBlockedUntil = 0;
};

const limitError = (seconds: number) => {
  return new UpstreamError(
    `Ollama's free web-search limit is used up for now. Try again in ${formatWait(seconds)}.`,
    429,
    seconds,
  );
};

const searchWeb = async (query: string, apiKey: string) => {
  const response = await fetch(OLLAMA_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, max_results: SEARCH_RESULTS_PER_QUERY }),
  });
  if (response.status === 429) {
    const seconds = Number(response.headers.get("Retry-After")) || 60;
    searchBlockedUntil = Date.now() + seconds * 1000;
    throw limitError(seconds);
  }
  if (!response.ok)
    throw new UpstreamError(`Web search failed (${response.status}).`, 502);
  const data = (await response.json()) as { results?: SearchResult[] };
  return data.results ?? [];
};

const jobSchema = {
  type: "object",
  properties: {
    jobs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          company: { type: "string" },
          location: { type: "string" },
          workMode: {
            type: "string",
            enum: ["remote", "hybrid", "onsite", "unknown"],
          },
          experience: { type: "string" },
          salary: { type: "string" },
          postedAt: { type: "string" },
          url: { type: "string" },
          skills: { type: "array", items: { type: "string" } },
          summary: { type: "string" },
          contactEmail: { type: "string" },
        },
        required: [
          "title",
          "company",
          "location",
          "workMode",
          "url",
          "skills",
          "summary",
        ],
      },
    },
  },
  required: ["jobs"],
};

const extractionPrompt = `You extract job openings from web search results.
Rules:
- Use only the results given. Never invent jobs, companies or URLs.
- Return one job per result that is a single, specific job posting. Skip articles, salary guides and generic search pages.
- "url" must be copied exactly from the result.
- "experience" like "2-5 years", "salary" and "postedAt" (YYYY-MM-DD) only when stated, else "".
- "skills": technologies the posting asks for. "summary": one sentence about the role.
- "contactEmail": an application or recruiter email only if the result states one, else "".
Respond with JSON only, no prose or markdown, in exactly this shape:
{"jobs":[{"title":"","company":"","location":"","workMode":"remote|hybrid|onsite|unknown","experience":"","salary":"","postedAt":"","url":"","skills":[""],"summary":"","contactEmail":""}]}`;

// The model sometimes wraps the JSON in prose or a code fence; take the outermost object.
export const parseJsonObject = (content: string): unknown => {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(content.slice(start, end + 1));
  } catch {
    return null;
  }
};

const extractJobs = async (results: SearchResult[], apiKey: string) => {
  const listing = results
    .map(
      (result, index) =>
        `### Result ${index + 1}\nURL: ${result.url}\nTitle: ${result.title}\n${result.content.slice(0, SNIPPET_CHARS)}`,
    )
    .join("\n\n");
  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      think: "low",
      format: jobSchema,
      messages: [
        { role: "system", content: extractionPrompt },
        { role: "user", content: listing },
      ],
    }),
  });
  if (!response.ok)
    throw new Error(`Model request failed (${response.status}).`);
  const data = (await response.json()) as { message?: { content?: string } };
  return parseJsonObject(data.message?.content ?? "");
};

// Saved results for a query. During a cool-down, stale results beat an error.
const cachedJobs = (query: string, fresh: boolean) => {
  const hit = jobsCache.get(query.trim().toLowerCase());
  if (!hit) return null;
  const coolingDown = searchBlockedUntil > Date.now();
  if ((hit.expires > Date.now() && !fresh) || coolingDown)
    return { ...hit.result, cached: true };
  return null;
};

const findJobs = async (
  query: string,
  apiKey: string,
): Promise<JobSearchResult> => {
  const waitMs = searchBlockedUntil - Date.now();
  if (waitMs > 0) throw limitError(Math.ceil(waitMs / 1000));
  const queries = buildJobQueries(query);
  const byUrl = new Map<string, SearchResult>();
  let partial = false;
  let retryAfter = 0;
  // One search at a time: parallel bursts trip Ollama's rate limit. If a search fails
  // mid-run, keep what earlier searches found but report it as partial.
  for (const entry of queries) {
    try {
      const results = await searchWeb(entry, apiKey);
      results.forEach((result) => {
        if (result.url && !byUrl.has(result.url)) byUrl.set(result.url, result);
      });
    } catch (caught) {
      if (byUrl.size === 0) throw caught;
      partial = true;
      if (caught instanceof UpstreamError) retryAfter = caught.retryAfter;
      break;
    }
  }
  const results = [...byUrl.values()];
  const extracted = results.length
    ? sanitizeJobs(await extractJobs(results, apiKey), new Set(byUrl.keys()))
    : [];
  // Keep dates and emails only when the page itself states them; the model tends to guess.
  const jobs = extracted.map((job) => {
    const page = byUrl.get(job.url)?.content ?? "";
    return {
      ...job,
      postedAt:
        job.postedAt && pageMentionsDate(page, job.postedAt)
          ? job.postedAt
          : "",
      contactEmail:
        job.contactEmail && page.toLowerCase().includes(job.contactEmail)
          ? job.contactEmail
          : "",
    };
  });
  const result: JobSearchResult = {
    query,
    queries,
    searchedAt: new Date().toISOString(),
    jobs,
  };
  if (partial)
    return retryAfter
      ? { ...result, partial, retryAfter }
      : { ...result, partial };
  // Only complete runs are cached, so a partial list isn't served for hours.
  if (jobs.length)
    jobsCache.set(query.trim().toLowerCase(), {
      result,
      expires: Date.now() + JOBS_CACHE_TTL_MS,
    });
  return result;
};

// One web search for a company's HR/careers address. Cached, and never during a cool-down.
const findHrEmail = async (company: string, apiKey: string) => {
  const key = company.trim().toLowerCase();
  const hit = hrCache.get(key);
  if (hit && hit.expires > Date.now()) return { ...hit.result, cached: true };
  const waitMs = searchBlockedUntil - Date.now();
  if (waitMs > 0) throw limitError(Math.ceil(waitMs / 1000));
  const results = await searchWeb(
    `"${company}" HR OR careers OR recruitment email`,
    apiKey,
  );
  const result = pickHrEmail(results, company);
  // "Not found" isn't cached, so a later click can try again.
  if (result.email)
    hrCache.set(key, { result, expires: Date.now() + HR_CACHE_TTL_MS });
  return result;
};

const MAX_COMPANY_CHARS = 80;

const missingKey = (headers: Record<string, string>) =>
  json(
    500,
    { error: "Chat is not configured (missing OLLAMA_API_KEY)." },
    headers,
  );

// Upstream failures keep their status; a 429 also tells the client how long to wait.
const errorResponse = (
  caught: unknown,
  fallback: string,
  headers: Record<string, string>,
) => {
  const message = caught instanceof Error ? caught.message : fallback;
  if (!(caught instanceof UpstreamError))
    return json(502, { error: message }, headers);
  return json(
    caught.status,
    // `quota`: Ollama's web-search quota, which blocks every search (not just this client).
    caught.retryAfter
      ? { error: message, retryAfter: caught.retryAfter, quota: true }
      : { error: message },
    headers,
  );
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

  let body: {
    mode?: unknown;
    messages?: unknown;
    verify?: unknown;
    jobs?: { query?: unknown; fresh?: unknown };
    hrEmail?: { company?: unknown };
  };
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

  // Job finder. Owner only, because each search spends web search quota.
  if (body.jobs && typeof body.jobs === "object") {
    if (!isOwner(request, env))
      return json(403, { error: "Access denied." }, headers);
    const query = body.jobs.query;
    if (
      query !== undefined &&
      (typeof query !== "string" || query.length > MAX_JOB_QUERY_CHARS)
    )
      return json(400, { error: "Invalid job search query" }, headers);
    // Cached results cost no quota, so they skip the per-client limit.
    const cached = cachedJobs(query ?? "", body.jobs.fresh === true);
    if (cached) return json(200, cached, headers);
    const limitKey = `jobs:${clientId}`;
    if (
      isRateLimited(limitKey, Date.now(), JOBS_LIMIT_MAX, JOBS_LIMIT_WINDOW_MS)
    ) {
      const retryAfter = rateLimitRetryAfter(limitKey, JOBS_LIMIT_WINDOW_MS);
      return json(
        429,
        {
          error: `Job search limit reached. Try again in ${formatWait(retryAfter)}.`,
          retryAfter,
        },
        headers,
      );
    }
    if (!env.OLLAMA_API_KEY) return missingKey(headers);
    try {
      return json(
        200,
        await findJobs(query ?? "", env.OLLAMA_API_KEY),
        headers,
      );
    } catch (caught) {
      return errorResponse(caught, "Job search failed.", headers);
    }
  }

  // HR email lookup for "Send now". Owner only, one web search per company.
  if (body.hrEmail && typeof body.hrEmail === "object") {
    if (!isOwner(request, env))
      return json(403, { error: "Access denied." }, headers);
    const company = body.hrEmail.company;
    if (
      typeof company !== "string" ||
      !company.trim() ||
      company.length > MAX_COMPANY_CHARS
    )
      return json(400, { error: "Invalid company" }, headers);
    if (!env.OLLAMA_API_KEY) return missingKey(headers);
    try {
      return json(200, await findHrEmail(company, env.OLLAMA_API_KEY), headers);
    } catch (caught) {
      return errorResponse(caught, "HR email lookup failed.", headers);
    }
  }

  const mode: ChatMode = body.mode === "owner" ? "owner" : "public";
  if (mode === "owner" && !isOwner(request, env))
    return json(403, { error: "Access denied." }, headers);
  if (!env.OLLAMA_API_KEY) return missingKey(headers);

  let messages: IncomingMessage[] | null;
  try {
    messages = parseMessages(body.messages);
  } catch (caught) {
    if (caught instanceof MessageTooLongError)
      return json(400, { error: caught.message }, headers);
    throw caught;
  }
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
