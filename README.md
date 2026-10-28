# Arun Narangali – VS Code Portfolio

A VS Code-inspired portfolio that presents each section as a “file” inside a simulated workbench (explorer, tabs, editor, terminal, and command palette).

## Highlights

- File-based navigation for portfolio sections
- Command Palette shortcuts and global search
- Terminal-style commands for quick actions
- Theme and layout switching (Dark/Light/High Contrast, Compact/Comfortable)
- Split editor on desktop for side-by-side views
- **Run & Debug (Job Fit)**: paste a job description to get a skill fit score, matched/missing skills, breakpoints to portfolio files, and a copyable report
- **Copilot Chat (AI)**: a VS Code Copilot-style chat panel powered by Ollama Cloud (`gpt-oss:20b`) with streaming answers, follow-up questions, slash commands and links that open portfolio files
  - **Ask Arun** (public): visitors ask about projects, skills and experience; answers come only from `content.ts`
  - **JARVIS** (owner only, passcode): a private assistant behind an Iron Man–style verification screen, with:
    - **Job finder** (`/jobs [query]`): searches the web for matching openings and shows cards with fit score, location/role filters and an Apply link
    - **Cover letters + Send now**: drafts a letter for a job and opens Gmail with recipient, subject and letter filled in (recipient from the posting or a one-search HR email lookup)
    - **Application tracker** (`/applied`): mark jobs as applied, see an Applied badge when they show up again, export/import as CSV

## AI Chat

Open it from the title bar or status bar chat icon, `Ctrl+Alt+I`, the Command Palette (`Chat: …`), or the terminal (`ask <question>`).

| Command | Mode | What it does |
| --- | --- | --- |
| `/projects`, `/skills`, `/experience`, `/contact` | both | Ready-made questions |
| `/clear` | both | Start a new chat |
| `/owner` / `/public` | both | Unlock JARVIS (asks for the passcode) / lock it again |
| `/jobs [query]` | owner | Find job openings, e.g. `/jobs golang remote` |
| `/applied` | owner | Applied-jobs tracker with CSV download/import |

How it fits together:

- **Server proxy** — `worker/chat.ts` keeps the API key and passcode server-side. It runs inside the Vite dev server locally and as a Cloudflare Worker in production (see `worker/README.md`). It validates and rate-limits requests and re-checks the passcode on every owner request.
- **Follow-ups** — the last 12 messages (max 24,000 characters) are sent with each question. Job results and the applications tracker are included as compact lists, so questions like "which of these are remote?" or "write a cover letter for #2" work. Each job card shows its fixed `#number` (best fit first), so filters and sorting never change what "#2" means.
- **Web search quota** — the job finder and HR lookup use Ollama's free web search, which allows only a small burst. Results are cached (jobs 6 h, HR emails 7 days) and the chat shows a countdown when the limit is reached.
- **Nothing is sent automatically** — "Send now" only opens Gmail; you review, attach your CV and send it yourself.
- **Applications are stored in this browser** (`localStorage`). Use Download CSV for backups or to move them to another device. Storage goes through one `ApplicationStore` interface so a database can replace it later.

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS + PostCSS
- ESLint
- Vitest (testing)
- Ollama Cloud (`gpt-oss:20b` + web search) for the AI chat
- Cloudflare Workers for the chat proxy

## Requirements

- Node.js 18.18+ for the app; Node.js 22.12+ is required to run the Vitest 5 test suite
- npm 9+ (or any npm-compatible package manager)

## Getting Started

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev
```

Open `http://localhost:5173/arun-n-dev/` in your browser.

`.env.local` (never committed):

- `OLLAMA_API_KEY` — from ollama.com/settings/keys; powers the chat, job search and HR email lookup
- `OWNER_PASSCODE` — the access code JARVIS asks for to unlock owner mode

The site works without them; the chat then shows "Chat isn't set up on this site yet."

## Scripts

- `npm run dev` — start local dev server
- `npm run build` — typecheck and build for production
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint
- `npm run test` — run vitest suite

## Folder Structure

```
.
├── public/
├── src/
│   ├── app/
│   ├── assets/
│   ├── features/
│   │   └── vscode/
│   │       ├── components/
│   │       ├── data/
│   │       ├── hooks/
│   │       ├── state/
│   │       └── utils/
│   ├── pages/
│   ├── portfolio/
│   │   ├── ai/            # chat client, prompts, job finder, cover letters, applications
│   │   ├── data/
│   │   ├── Home.tsx
│   │   ├── About.tsx
│   │   ├── Projects.tsx
│   │   ├── Experience.tsx
│   │   ├── Skills.tsx
│   │   ├── Contact.tsx
│   │   └── README.md
│   ├── styles/
│   ├── types/
│   └── main.tsx
├── worker/                # chat proxy (Cloudflare Worker + Vite dev middleware)
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## Content Updates

- Update portfolio content in `src/portfolio/content.ts`.
- Update external links in `src/portfolio/data/links.json`.
- Update metadata in `src/portfolio/data/meta.json`.

## Portfolio Data Sources

- `src/portfolio/content.ts` — hero copy, about, projects, experience, skills, socials
- `src/portfolio/data/links.json` — GitHub, LinkedIn, website, newsletter
- `src/portfolio/data/meta.json` — title, description, OG image
- `src/portfolio/changelog.ts` — career journey + changelog entries
- `src/portfolio/extensions.ts` — Extensions panel cards
- `src/portfolio/searchIndex.ts` — global search matching
- `src/portfolio/jobFit.ts` — job description skill-fit analysis (matched/missing skills, score, breakpoints)
- `src/portfolio/jobFit.test.ts` — vitest cases for the Job Fit analyzer

## AI Chat Files

- `worker/chat.ts` — proxy: Ollama chat streaming, job search, HR email lookup, passcode check, rate limits, caches
- `src/portfolio/ai/systemPrompt.ts` — public and JARVIS prompts built from `content.ts`
- `src/portfolio/ai/chatClient.ts`, `useChat.ts` — requests, streaming, per-mode history
- `src/portfolio/ai/modelHistory.ts`, `chatLimits.ts` — what the model sees for follow-ups, and size limits
- `src/portfolio/ai/slashCommands.ts` — slash commands
- `src/portfolio/ai/jobs.ts` — job listing types, query building, location/role filters, HR email picking
- `src/portfolio/ai/coverLetter.ts` — cover letter parsing, signature and Gmail compose link
- `src/portfolio/ai/applications.ts`, `useApplications.ts` — applied-jobs store, matching and CSV
- `src/features/vscode/components/chat/` — chat panel, JARVIS verification, job cards, send bar, tracker
- Tests: `src/portfolio/ai/chat.test.ts`, `jobs.test.ts`, `applications.test.ts`

## Design Principles

- React 18 + TypeScript
- Tailwind utility surface with custom tokens
- Accessibility-first (focus states, contrast, semantic groups)
- Minimal, deliberate motion (no neon glows)

I keep this workspace synced with production worklogs every quarter.

## Deployment

Build output is generated in `dist/`.

```bash
npm run build
npm run preview
```

Host the `dist/` folder on any static hosting provider (Netlify, Vercel, GitHub Pages, etc.).

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the site for GitHub Pages and deploys the AI chat proxy (`worker/`) to Cloudflare.

The chat needs a few GitHub **repository secrets** (Settings → Secrets and variables → Actions): `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `OLLAMA_API_KEY` and `OWNER_PASSCODE`. They go only to the Cloudflare Worker, never into the site build, because anything in a static site is public. After the first deploy, paste the Worker URL into `PRODUCTION_CHAT_URL` in `src/portfolio/ai/chatClient.ts`. Step-by-step setup is in `worker/README.md`.
