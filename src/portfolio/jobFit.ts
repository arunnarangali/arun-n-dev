import { allSkills, heroContent, projects } from './content'
import { runSearch, type SearchGroup } from './searchIndex'

type SkillEntry = { label: string; aliases: string[] }

export type JobFitHit = { term: string; groups: SearchGroup[] }

export type JobFitResult = {
  score: number
  matched: string[]
  missing: string[]
  hits: JobFitHit[]
  topProjects: string[]
  experience: string
}

// Extra spellings recruiters use for skills already listed in content.ts.
const aliasMap: Record<string, string[]> = {
  'React.js': ['react', 'reactjs', 'react.js'],
  TypeScript: ['typescript', 'ts'],
  JavaScript: ['javascript', 'js', 'es6'],
  Golang: ['golang', 'go lang'],
  'Node.js': ['node', 'nodejs', 'node.js'],
  'Tailwind CSS': ['tailwind', 'tailwindcss', 'tailwind css'],
  'REST APIs': ['rest api', 'rest apis', 'restful'],
  'Gin Framework': ['gin'],
  'Framer Motion': ['framer motion', 'framer'],
  Postmen: ['postman'],
  'Unit Testing': ['unit testing', 'unit tests', 'testing'],
  'Accessibility Auditing': ['accessibility', 'a11y', 'wcag'],
  'Responsive Architecture': ['responsive', 'mobile-first', 'mobile first'],
  'Performance Auditing': ['performance', 'web vitals', 'lighthouse'],
  'Code Reviews': ['code review', 'code reviews'],
  'Chrome DevTools': ['devtools', 'chrome devtools'],
  MongoDB: ['mongodb', 'mongo'],
  'VS Code': ['vs code', 'vscode'],
}

// Common tech terms used to detect JD requirements the portfolio doesn't cover.
const knownTechTerms = [
  'Angular', 'Vue', 'Svelte', 'Next.js', 'Nuxt', 'Remix', 'GraphQL', 'Apollo', 'Python', 'Java', 'Kotlin', 'Swift',
  'C#', '.NET', 'PHP', 'Ruby', 'Rust', 'Django', 'Flask', 'Spring', 'Express.js', 'NestJS', 'AWS', 'Azure', 'GCP',
  'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Jenkins', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch',
  'Firebase', 'Jest', 'Cypress', 'Playwright', 'Vitest', 'Storybook', 'React Native', 'Flutter', 'Sass',
  'Styled Components', 'Zustand', 'MobX', 'Figma', 'Webpack', 'Microservices', 'WebSockets', 'Three.js', 'D3',
]

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim()

const buildCatalog = (): SkillEntry[] => {
  const labels = new Set([...allSkills, ...projects.flatMap((project) => project.stack)])
  return [...labels].map((label) => ({
    label,
    aliases: [...new Set([normalize(label), ...(aliasMap[label] ?? [])])],
  }))
}

const catalog = buildCatalog()

const escapeRegex = (value: string) => value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')

// Word-boundary match that also works for terms like "c#", ".net", "ci/cd".
const containsTerm = (text: string, term: string) =>
  new RegExp(`(^|[^a-z0-9])${escapeRegex(term)}(?=$|[^a-z0-9])`, 'i').test(text)

export const sampleJobDescription = `Senior Frontend Engineer
We are looking for an engineer with strong React and TypeScript skills, experience with Tailwind CSS,
REST APIs and state management (Redux). Bonus: Golang, Kafka, Docker, Kubernetes, GraphQL and Jest.
You care about accessibility, performance and code reviews.`

export const analyzeJobFit = (description: string): JobFitResult => {
  const text = normalize(description)
  const matchedEntries = catalog.filter((entry) => entry.aliases.some((alias) => containsTerm(text, alias)))
  const matched = matchedEntries.map((entry) => entry.label)
  const matchedLower = new Set(matched.map(normalize))

  const missing = knownTechTerms.filter((term) => {
    const lower = normalize(term)
    if (matchedLower.has(lower)) return false
    return containsTerm(text, lower)
  })

  const hits = matched
    .map((term) => ({ term, groups: runSearch(term) }))
    .filter((hit) => hit.groups.length > 0)

  const topProjects = projects
    .map((project) => {
      const haystack = normalize(`${project.title} ${project.summary} ${project.stack.join(' ')}`)
      const overlap = matchedEntries.filter((entry) => entry.aliases.some((alias) => containsTerm(haystack, alias))).length
      return { title: project.title, overlap }
    })
    .filter((project) => project.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 3)
    .map((project) => project.title)

  const total = matched.length + missing.length
  const score = total === 0 ? 0 : Math.round((matched.length / total) * 100)
  const experience = heroContent.metrics.find((metric) => metric.label.toLowerCase().includes('experience'))?.value ?? '2.5+'

  return { score, matched, missing, hits, topProjects, experience: `${experience} years` }
}

export const formatJobFitReport = (result: JobFitResult): string[] => {
  if (result.matched.length === 0 && result.missing.length === 0) {
    return ['No recognizable skills found. Paste a job description with tech requirements.']
  }
  return [
    `› Fit score: ${result.score}% · Experience: ${result.experience}`,
    ...result.hits.map(
      (hit) => `› matched ${hit.term} (${hit.groups.map((group) => `${group.fileName}:${group.matches.map((m) => m.line).join(',')}`).join(', ')})`,
    ),
    ...result.matched
      .filter((term) => !result.hits.some((hit) => hit.term === term))
      .map((term) => `› matched ${term}`),
    ...result.missing.map((term) => `⚠ '${term}' not found — learning in progress`),
    result.topProjects.length ? `✔ Best matching projects: ${result.topProjects.join(' · ')}` : '✔ Analysis complete.',
  ]
}
