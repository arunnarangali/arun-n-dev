# Chat proxy

`chat.ts` sits between the chat panel and Ollama. It's needed because ollama.com blocks
requests from browsers, and because the API key must not be in the website code.

- **Local:** nothing to do. `npm run dev` runs `chat.ts` inside Vite using `OLLAMA_API_KEY` and `OWNER_PASSCODE` from `.env.local`.
- **Live site:** deploy it once to Cloudflare (free):

```bash
cd worker
npx wrangler secret put OLLAMA_API_KEY
npx wrangler secret put OWNER_PASSCODE   # the code JARVIS asks for to unlock owner mode
npx wrangler deploy
```

Paste the printed `https://….workers.dev` URL into `PRODUCTION_CHAT_URL` in
`src/portfolio/ai/chatClient.ts`, then push.

## What it handles

All requests are `POST` with JSON. Owner-only requests need the `X-Owner-Passcode` header.

| Body | Access | What it does |
| --- | --- | --- |
| `{ mode, messages }` | public; `mode: "owner"` needs the passcode | Streams a chat answer (NDJSON) from `gpt-oss:20b` |
| `{ verify: true }` | — | Checks the passcode for the JARVIS screen (200 / 403); never calls Ollama |
| `{ jobs: { query?, fresh? } }` | owner | Web search + extraction into job listings |
| `{ hrEmail: { company } }` | owner | One web search for a company's HR/careers email |

## Limits and caching

- **Chat:** 12 requests per minute per IP. Only the newest question must fit 4,000 characters; longer earlier turns are shortened.
- **Job search:** 4 fresh searches per 10 minutes per IP (cached results don't count). Each run uses 3 Ollama web searches. Complete results are cached for 6 hours; `fresh: true` (the Refresh button) skips the cache.
- **HR email lookup:** found addresses are cached for 7 days; "not found" isn't cached.
- **Ollama's free web-search quota** is small. On a 429 the Worker stops calling Ollama until the `Retry-After` time and returns `retryAfter` (seconds) so the chat can show a countdown.
- **Anti-hallucination:** listings are kept only if their URL came back from the search; posted dates and contact emails only if the page states them; HR emails are taken from page text with a regex, never generated.

Caches and limits are in memory, so they reset when the Worker or dev server restarts.
