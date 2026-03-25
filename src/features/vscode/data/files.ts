import type { ComponentType } from 'react'
import HomeSection from '../../../portfolio/Home'
import AboutSection from '../../../portfolio/About'
import ProjectsSection from '../../../portfolio/Projects'
import ExperienceSection from '../../../portfolio/Experience'
import SkillsSection from '../../../portfolio/Skills'
import ContactSection from '../../../portfolio/Contact'

import homeSource from '../../../portfolio/Home.tsx?raw'
import aboutSource from '../../../portfolio/About.tsx?raw'
import projectsSource from '../../../portfolio/Projects.tsx?raw'
import experienceSource from '../../../portfolio/Experience.tsx?raw'
import skillsSource from '../../../portfolio/Skills.tsx?raw'
import contactSource from '../../../portfolio/Contact.tsx?raw'
import readmeSource from '../../../portfolio/README.md?raw'
import metaSource from '../../../portfolio/data/meta.json?raw'
import linksSource from '../../../portfolio/data/links.json?raw'

type BaseFile = {
  id: string
  name: string
  path: string[]
  icon: string
}

type TsxFile = BaseFile & {
  kind: 'tsx'
  language: 'tsx'
  preview: ComponentType
  source: string
}

type MarkdownFile = BaseFile & {
  kind: 'markdown'
  source: string
}

type JsonFile = BaseFile & {
  kind: 'json'
  source: string
}

export type PortfolioFile = TsxFile | MarkdownFile | JsonFile

export const portfolioFiles: PortfolioFile[] = [
  {
    id: 'portfolio/src/pages/Home.tsx',
    name: 'Home.tsx',
    path: ['portfolio', 'src', 'pages', 'Home.tsx'],
    icon: 'code',
    kind: 'tsx',
    language: 'tsx',
    preview: HomeSection,
    source: homeSource,
  },
  {
    id: 'portfolio/src/pages/About.tsx',
    name: 'About.tsx',
    path: ['portfolio', 'src', 'pages', 'About.tsx'],
    icon: 'code',
    kind: 'tsx',
    language: 'tsx',
    preview: AboutSection,
    source: aboutSource,
  },
  {
    id: 'portfolio/src/pages/Projects.tsx',
    name: 'Projects.tsx',
    path: ['portfolio', 'src', 'pages', 'Projects.tsx'],
    icon: 'code',
    kind: 'tsx',
    language: 'tsx',
    preview: ProjectsSection,
    source: projectsSource,
  },
  {
    id: 'portfolio/src/pages/Experience.tsx',
    name: 'Experience.tsx',
    path: ['portfolio', 'src', 'pages', 'Experience.tsx'],
    icon: 'code',
    kind: 'tsx',
    language: 'tsx',
    preview: ExperienceSection,
    source: experienceSource,
  },
  {
    id: 'portfolio/src/pages/Skills.tsx',
    name: 'Skills.tsx',
    path: ['portfolio', 'src', 'pages', 'Skills.tsx'],
    icon: 'code',
    kind: 'tsx',
    language: 'tsx',
    preview: SkillsSection,
    source: skillsSource,
  },
  {
    id: 'portfolio/src/pages/Contact.tsx',
    name: 'Contact.tsx',
    path: ['portfolio', 'src', 'pages', 'Contact.tsx'],
    icon: 'code',
    kind: 'tsx',
    language: 'tsx',
    preview: ContactSection,
    source: contactSource,
  },
  {
    id: 'portfolio/README.md',
    name: 'README.md',
    path: ['portfolio', 'README.md'],
    icon: 'article',
    kind: 'markdown',
    source: readmeSource,
  },
  {
    id: 'portfolio/src/data/meta.json',
    name: 'meta.json',
    path: ['portfolio', 'src', 'data', 'meta.json'],
    icon: 'data_object',
    kind: 'json',
    source: metaSource,
  },
  {
    id: 'portfolio/src/data/links.json',
    name: 'links.json',
    path: ['portfolio', 'src', 'data', 'links.json'],
    icon: 'data_object',
    kind: 'json',
    source: linksSource,
  },
]

export const getFileById = (id: string) => portfolioFiles.find((file) => file.id === id)

export const getLanguageLabel = (file?: PortfolioFile) => {
  if (!file) return 'Plaintext'
  switch (file.kind) {
    case 'markdown':
      return 'Markdown'
    case 'json':
      return 'JSON'
    case 'tsx':
      return 'TSX'
    default:
      return 'Plaintext'
  }
}
