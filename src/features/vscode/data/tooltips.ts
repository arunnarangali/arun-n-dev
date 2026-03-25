export const propertyHints: Record<string, string> = {
  name: 'Developer identity label. Type: string',
  role: 'Primary engineering role/focus. Type: string',
  location: 'Base region for engagements. Type: string',
  description: 'Short summary displayed in hero copy. Type: string',
  focusAreas: 'Key initiatives array. Type: string[]',
  availability: 'Engagement availability string. Type: string',
  projects: 'Collection of notable shipments. Type: Project[]',
  title: 'Project title. Type: string',
  type: 'Category label (Featured, Platform, etc.). Type: string',
  stack: 'Technologies leveraged per project. Type: string[]',
  image: 'Asset path for preview thumbnail. Type: string',
  summary: 'Brief context for the artifact. Type: string',
  languages: 'Programming languages mastered. Type: string[]',
  frameworks: 'Frontend frameworks & runtimes. Type: string[]',
  tooling: 'Workflow accelerators & build tools. Type: string[]',
  cloud: 'Infrastructure platforms. Type: string[]',
  email: 'Preferred contact address. Type: string',
  discord: 'Community handle. Type: string',
  website: 'Public portfolio link. Type: string (URL)',
  booking: 'Scheduling link. Type: string (URL)',
}

export const getHintForProperty = (key: string) =>
  propertyHints[key] ?? `Property: ${key}`
