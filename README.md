# Arun Narangali – VS Code Portfolio

A VS Code-inspired portfolio that presents each section as a “file” inside a simulated workbench (explorer, tabs, editor, terminal, and command palette).

## Highlights

- File-based navigation for portfolio sections
- Command Palette shortcuts and global search
- Terminal-style commands for quick actions
- Theme and layout switching (Dark/Light/High Contrast, Compact/Comfortable)
- Split editor on desktop for side-by-side views
- **Run & Debug (Job Fit)**: paste a job description to get a skill fit score, matched/missing skills, breakpoints to portfolio files, and a copyable report

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS + PostCSS
- ESLint
- Vitest (testing)

## Requirements

- Node.js 18.18+ for the app; Node.js 22.12+ is required to run the Vitest 5 test suite
- npm 9+ (or any npm-compatible package manager)

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

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
