export type PortfolioFile = {
  id: string
  name: string
  icon: string
  gitStatus?: 'M' | 'U'
  path: string[]
  content: Record<string, unknown>
}

export const portfolioFiles: PortfolioFile[] = [
  {
    id: 'about',
    name: 'about.json',
    icon: 'description',
    path: ['portfolio', 'src', 'about.json'],
    content: {
      name: 'Arun Narangali',
      role: 'React JS Developer',
      location: 'Kerala, India',
      description: 'Building digital products for the modern web.',
      focusAreas: ['Front-end Architecture', 'DX Tooling', 'Interactive Systems'],
      availability: 'Open for remote contracts',
    },
  },
  {
    id: 'projects',
    name: 'projects.json',
    icon: 'description',
    gitStatus: 'M',
    path: ['portfolio', 'src', 'projects.json'],
    content: {
      projects: [
        {
          title: 'CryptoFlow Dashboard',
          type: 'Featured',
          stack: ['React', 'TypeScript', 'Node'],
          image: '/images/cryptoflow.png',
          summary: 'Live DeFi intelligence with modular data widgets and alerting.',
        },
        {
          title: 'InfraSketch',
          type: 'Platform',
          stack: ['Next.js', 'GraphQL', 'AWS'],
          image: '/images/infrasketch.png',
          summary: 'Architecture modeling suite for distributed teams.',
        },
      ],
    },
  },
  {
    id: 'skills',
    name: 'skills.json',
    icon: 'description',
    gitStatus: 'U',
    path: ['portfolio', 'src', 'skills.json'],
    content: {
      languages: ['TypeScript', 'Go', 'Python'],
      frameworks: ['React', 'Next.js', 'Remix'],
      tooling: ['Node.js', 'Vite', 'Storybook'],
      cloud: ['AWS', 'GCP', 'Kubernetes'],
      focus: 'Design systems, performance engineering, DX tooling',
    },
  },
  {
    id: 'contact',
    name: 'contact.json',
    icon: 'description',
    path: ['portfolio', 'src', 'contact.json'],
    content: {
      email: 'dev@node_editorial.sh',
      discord: 'arun.codes',
      website: 'https://arun-react.dev',
      booking: 'https://cal.dev/arun',
      availability: 'GMT+5:30 · flexible across timezones',
    },
  },
]

export const getFileById = (id: string) => portfolioFiles.find((file) => file.id === id)
