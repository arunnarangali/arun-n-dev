export const heroContent = {
  title: 'Designing resilient React systems for ambitious teams',
  subtitle:
    '7+ years crafting scalable front-end architecture, design systems, and developer-experience tooling for global products.',
  ctas: [
    { label: 'View Case Studies', href: '#projects' },
    { label: 'Schedule Intro Call', href: '#contact', variant: 'ghost' },
  ],
  metrics: [
    { label: 'Systems launched', value: '24' },
    { label: 'Teams enabled', value: '12' },
    { label: 'Avg. perf gain', value: '38%' },
  ],
}

export const aboutContent = {
  name: 'Arun Narangali',
  role: 'Principal React Engineer / DX Strategist',
  bio: `I partner with product, design, and platform teams to ship durable UI infrastructure—design systems, performance platforms, and developer tooling. I stay close to business goals while coaching teams on pragmatic delivery.`,
  highlights: ['Remote-first', 'GMT+5:30', 'English + Malayalam'],
}

export type ProjectCard = {
  title: string
  summary: string
  stack: string[]
  image: string
  href: string
}

export const projects: ProjectCard[] = [
  {
    title: 'Telemetry Nexus',
    summary: 'Observability cockpit with streaming session replays and heatmaps powering 8 platform squads.',
    stack: ['React 18', 'Vite', 'WebGL', 'Turborepo'],
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1000&q=80',
    href: '#',
  },
  {
    title: 'Launch Console',
    summary: 'Composable release management UI orchestrating feature flags, KPIs, and guardrails for fintech rollouts.',
    stack: ['Next.js', 'GraphQL', 'Tailwind', 'Cypress'],
    image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1000&q=80',
    href: '#',
  },
  {
    title: 'Design System Atlas',
    summary: 'Token-driven system with multi-brand theming, accessibility guardrails, and visual regression tooling.',
    stack: ['Storybook', 'Chromatic', 'Radix UI', 'Figma Tokens'],
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80',
    href: '#',
  },
]

export const experiences = [
  {
    company: 'CloudForge Labs',
    title: 'Principal Front-end Architect',
    period: '2022 — Present',
    bullets: [
      'Scaled micro-frontend platform with shared runtime contracts and linting adapters.',
      'Reduced customer onboarding time 45% via guided workflow builder.',
    ],
  },
  {
    company: 'Latitude Data',
    title: 'Lead React Engineer',
    period: '2019 — 2022',
    bullets: [
      'Replatformed analytics suite with streaming dashboard and offline sync.',
      'Introduced design tokens powering six white-label brands.',
    ],
  },
]

export const skillGroups = [
  { label: 'Languages', items: ['TypeScript', 'Go', 'Python'] },
  { label: 'Frameworks', items: ['React', 'Next.js', 'Remix'] },
  { label: 'Tooling', items: ['Vite', 'Turborepo', 'Storybook', 'Vitest'] },
  { label: 'Cloud', items: ['AWS', 'GCP', 'Cloudflare Workers'] },
]

export const socials = [
  { label: 'Email', value: 'dev@node_editorial.sh', href: 'mailto:dev@node_editorial.sh' },
  { label: 'GitHub', value: '@arunreact', href: 'https://github.com/arunreact' },
  { label: 'LinkedIn', value: 'in/arunnarangali', href: 'https://linkedin.com/in/arunnarangali' },
  { label: 'Twitter', value: '@arunreact', href: 'https://twitter.com/arunreact' },
]
