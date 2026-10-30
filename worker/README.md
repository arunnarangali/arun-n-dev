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
| `{ mode: "owner", messages, jobContext: { url, title, company } }` | owner | Cover letters: reads the posting's job description first (see below), then streams the letter. Header `X-Job-Description: full; source=…` or `summary; reason=blocked\|cooldown\|failed` |
| `{ verify: true }` | — | Checks the passcode for the Akaza screen (200 / 403); never calls Ollama |
| `{ jobs: { query?, fresh?, preferences?, applied? } }` | owner | Web search + extraction into job listings. `preferences`: up to 10 "Not a fit" feedback lines (≤150 chars each); matching jobs are left out and returned in `skipped`. `applied`: up to 100 `{ company, title, url }` already applied to; postings with the same URL are removed, even from cached results, and counted in `applied`. Same company + title matches are kept so the chat can mark them (applied / repost) and offer "Apply anyway" |
| `{ hrEmail: { company } }` | owner | One web search for a company's HR/careers email |
| `{ enhance: { text } }` | public (visitors: 3/day) | ✨ Improve my message: fixes spelling and makes the draft clearer. Returns `{ text, changed }` (+ `remaining` for visitors) |
| `{ suggest: { messages } }` | public (visitors: 3/day) | One likely reply to the assistant's last question (last 4 turns sent). Returns `{ suggestion }` |
| `{ tracker: { get: true } }` | owner | The synced job tracker document (needs the `TRACKER` KV binding, else 503) |
| `{ tracker: { put, baseVersion } }` | owner | Saves the tracker if nobody saved since `baseVersion`; otherwise 409 with the current copy to merge |

## Limits and caching

- **Chat:** 12 requests per minute per IP. Only the newest question must fit 4,000 characters; longer earlier turns are shortened.
- **Job search:** 4 fresh searches per 10 minutes per IP (cached results don't count). Each run uses 3 Ollama web searches. Complete results are cached for 6 hours, per query and feedback, so new "Not a fit" feedback triggers a new search. `fresh: true` (the Refresh button) skips the cache.
- **HR email lookup:** found addresses are cached for 7 days; "not found" isn't cached.
- **Ollama's free web-search quota** is small. On a 429 the Worker stops calling Ollama until the `Retry-After` time and returns `retryAfter` (seconds) so the chat can show a countdown.
- **Anti-hallucination:** listings are kept only if their URL came back from the search; posted dates and contact emails only if the page states them; HR emails are taken from page text with a regex, never generated.

Caches and limits are in memory, so they reset when the Worker or dev server restarts.

## Cover letters from the real job description

- With `jobContext`, the Worker reads the posting through Ollama's web fetch (`POST https://ollama.com/api/web_fetch`), keeps the job description part (`extractJobDescription` in `jobs.ts`, up to 3,500 characters) and sends it to the model as a separate, delimited **data** message, never inside the instructions.
- Cached per posting URL for 24 hours, so redrafting the same job doesn't fetch again. Pages that couldn't be read are remembered for 30 minutes, so follow-ups don't retry them. One web fetch per new letter, owner only.
- The fetch gives up after 8 seconds and falls back to the summary, so a slow job site doesn't hold up the letter.
- Falls back to the search summary when the page is a sign-in or bot wall, isn't the posting (`looksUnreadable`), fails to load, or web access is in Ollama's quota cool-down. The `X-Job-Description` header (exposed via CORS) tells the chat which one was used, and the letter shows it.

## Chat input tools (✨ improve, suggested reply)

- **✨ Improve** rewrites the draft (spelling, grammar, clarity) without changing its meaning. The draft goes in the user turn, never into the system prompt. The result is checked in `promptTools.ts` (`cleanRewrite`): it's dropped if it's empty, much longer, or loses a URL, and the UI then says "Already looks good".
- **Suggested reply** is only requested when an answer ends with a question (`endsWithQuestion`, checked in the browser), so most answers cost no extra call. The prompt forbids inventing names or details; `cleanSuggestion` keeps one line of up to 120 characters.
- **Limits:** visitors get 3 of each a day per IP; the owner gets 30 per 10 minutes. Blocked attempts aren't counted, and a failed model call gives the use back. A wrong passcode counts against the general 12/min limit. Counts are in memory per Worker instance, so the visitor limit is approximate: it resets when Cloudflare recycles the instance (which can happen within minutes) and is counted separately in each location. A strict daily cap would need KV (about one write per use).

## Tracker sync

Applications, "Not a fit" and "Apply anyway" marks sync across devices, and between
localhost and the live site, through one Workers KV document (`TRACKER` binding, key `owner`).

- **Setup (once):**
  1. `npx wrangler kv namespace create TRACKER` (from `worker/`), then paste the printed id into the commented `[[kv_namespaces]]` block in `wrangler.toml` and uncomment it.
  2. Give the `CLOUDFLARE_API_TOKEN` GitHub secret the **Workers KV Storage: Edit** permission.
  3. Push to `main`. The existing workflow deploys it.
- **How it works:** each browser keeps working from localStorage. When Akaza is unlocked, it pulls the server copy, merges it in, and saves the result. After that it saves about 2 s after each change. Saves carry the version they started from; if another device saved first, the Worker answers 409 with its copy, and the browser merges and retries.
- **Deletes:** a removed record is kept as a tombstone (`deleted: true` + `updatedAt`) so another device's older copy can't bring it back. The newer change per record wins. Tombstones older than 90 days are dropped.
- **Local dev uses live data:** sync requests always go to the deployed Worker, even in `npm run dev`, so it needs the live site's access code. Set `VITE_TRACKER_SYNC=off` in `.env.local` to test without touching real data.
- **Limits:** owner only. Wrong passcodes count against the general 12-per-minute limit, so sync can't be used to guess the passcode. 30 reads per minute and 30 saves per 10 minutes per IP, documents up to 256 KB (UTF-8 bytes) and 2,000 records per list. That keeps well inside KV's free plan (1,000 writes a day).
- **Only the tab you edit in uploads.** Other open tabs reload the change but don't save it again.
- **Same item, different ids:** the merge also folds together copies of one application (same posting URL, or no URL and the same role on the same day) and one "Not a fit" mark per role, so importing the same CSV on two devices doesn't duplicate anything.
- **Failed or damaged storage:** a failed KV read fails the request (502), so a save is never compared against a made-up empty tracker. If the stored document is damaged, it's kept under `owner-damaged-<time>` and replaced by an empty one with a higher version; devices then merge their own copies back in.
- **CSV restores win:** imported rows count as changed at import time, so restoring from a backup isn't undone by an earlier deletion on another device.
- **Known limit:** KV has no atomic compare-and-save and can serve a copy up to ~60 s old at another edge. Two devices saving within that window can overwrite each other's latest change. Nothing is lost for good: each browser keeps its own copy and merges it back on its next sync. Fixing it fully would mean moving to a Durable Object or D1.

## TODO

- **Attach the CV for real.** "Send now" opens a Gmail compose link, which can't carry attachments, so it adds a resume link to the signature and downloads `ArunCV.pdf` for dragging in. Next step: send through the Gmail API (Google OAuth: a Google Cloud project, consent screen and client ID) with the PDF attached.
