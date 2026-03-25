export type ExtensionInfo = {
  name: string
  description: string
  proficiency: number
  icon: string
}

export const extensions: ExtensionInfo[] = [
  {
    name: 'React Pro Tools',
    description: 'Component-driven architecture and performance instrumentation.',
    proficiency: 5,
    icon: '/images/extensions/react.svg',
  },
  {
    name: 'TypeScript Essentials',
    description: 'Strict typing for monorepos and API contracts.',
    proficiency: 5,
    icon: '/images/extensions/typescript.svg',
  },
  {
    name: 'Tailwind CSS Mastery',
    description: 'Scalable utility-first design systems.',
    proficiency: 4,
    icon: '/images/extensions/tailwind.svg',
  },
  {
    name: 'Node & GraphQL Toolkit',
    description: 'APIs, tooling, and server-side orchestration.',
    proficiency: 4,
    icon: '/images/extensions/node.svg',
  },
  {
    name: 'Docker & CI Suite',
    description: 'Environment parity, pipelines, deployment automation.',
    proficiency: 3,
    icon: '/images/extensions/docker.svg',
  },
]
