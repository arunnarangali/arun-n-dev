# Chat proxy

`chat.ts` sits between the chat panel and Ollama. It's needed because ollama.com blocks
requests from browsers, and because the API key must not be in the website code.

- **Local:** nothing to do. `npm run dev` runs `chat.ts` inside Vite using `OLLAMA_API_KEY` and `OWNER_PASSCODE` from `.env.local`.
- **Live site:** deployed automatically from GitHub on every push to `main` (the `deploy-worker` job in `.github/workflows/deploy.yml`).

> Never add `OLLAMA_API_KEY` or `OWNER_PASSCODE` to the website build (no Pages build env, no `VITE_` variable). Anything in the static site is public. They only go to Cloudflare as Worker secrets.

## Deploy from GitHub (one-time setup)

1. **Cloudflare** (free account):
   - My Profile → API Tokens → Create Token → template **"Edit Cloudflare Workers"** → copy the token.
   - Workers & Pages → copy your **Account ID** (right-hand side).
2. **GitHub** → your repo → **Settings → Secrets and variables → Actions → New repository secret**. Add:

   | Secret | Value |
   | --- | --- |
   | `CLOUDFLARE_API_TOKEN` | the token from step 1 |
   | `CLOUDFLARE_ACCOUNT_ID` | the account ID from step 1 |
   | `OLLAMA_API_KEY` | your key from ollama.com/settings/keys |
   | `OWNER_PASSCODE` | the access code Akaza asks for (use a new, strong one) |

3. **Push to `main`** (or re-run the latest workflow). Open **Actions → Deploy to GitHub Pages → deploy-worker** and copy the `https://arun-portfolio-chat.<subdomain>.workers.dev` URL from the log.
4. Paste that URL into `PRODUCTION_CHAT_URL` in `src/portfolio/ai/chatClient.ts` and push again. Only needed once.

After that, every push to `main` redeploys the Worker with the current secrets. To change the key or passcode, update the GitHub secret and re-run the workflow. Until `CLOUDFLARE_API_TOKEN` is set, the job is skipped with a notice and the site deploys as usual.

### Manual alternative

```bash
cd worker
npx wrangler login
npx wrangler secret put OLLAMA_API_KEY
npx wrangler secret put OWNER_PASSCODE   # the code Akaza asks for to unlock owner mode
npx wrangler deploy
```

## What it handles

All requests are `POST` with JSON. Owner-only requests need the `X-Owner-Passcode` header.

| Body | Access | What it does |
| --- | --- | --- |
| `{ mode, messages }` | public; `mode: "owner"` needs the passcode | Streams a chat answer (NDJSON) from `gpt-oss:20b` |
| `{ verify: true }` | — | Checks the passcode for the Akaza screen (200 / 403); never calls Ollama |
| `{ jobs: { query?, fresh? } }` | owner | Web search + extraction into job listings |
| `{ hrEmail: { company } }` | owner | One web search for a company's HR/careers email |

## Limits and caching

- **Chat:** 12 requests per minute per IP. Only the newest question must fit 4,000 characters; longer earlier turns are shortened.
- **Job search:** 4 fresh searches per 10 minutes per IP (cached results don't count). Each run uses 3 Ollama web searches. Complete results are cached for 6 hours; `fresh: true` (the Refresh button) skips the cache.
- **HR email lookup:** found addresses are cached for 7 days; "not found" isn't cached.
- **Ollama's free web-search quota** is small. On a 429 the Worker stops calling Ollama until the `Retry-After` time and returns `retryAfter` (seconds) so the chat can show a countdown.
- **Anti-hallucination:** listings are kept only if their URL came back from the search; posted dates and contact emails only if the page states them; HR emails are taken from page text with a regex, never generated.

Caches and limits are in memory, so they reset when the Worker or dev server restarts.
