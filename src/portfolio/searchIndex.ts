import { projects, experiences, skillGroups } from './content'

export type SearchMatch = { id: string; preview: string; line: number }
export type SearchGroup = { fileId: string; fileName: string; matches: SearchMatch[] }

const buildPreview = (text: string, query: string) => {
  const regex = new RegExp(`(${query.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark class="bg-emerald-500/30">$1</mark>')
}

export const runSearch = (query: string): SearchGroup[] => {
  const normalized = query.trim()
  if (!normalized) return []
  const matches: SearchGroup[] = []

  const addMatch = (fileId: string, fileName: string, text: string, index: number) => {
    const group = matches.find((item) => item.fileId === fileId)
    const entry = { id: `${fileId}-${index}`, preview: buildPreview(text, normalized), line: index + 1 }
    if (group) {
      group.matches.push(entry)
    } else {
      matches.push({ fileId, fileName, matches: [entry] })
    }
  }

  projects.forEach((project, index) => {
    const text = `${project.title} ${project.summary} ${project.stack.join(' ')}`
    if (text.toLowerCase().includes(normalized.toLowerCase())) {
      addMatch('portfolio/src/pages/Projects.tsx', 'Projects.tsx', text, index)
    }
  })

  skillGroups.forEach((group, index) => {
    const text = `${group.label} ${group.items.join(' ')}`
    if (text.toLowerCase().includes(normalized.toLowerCase())) {
      addMatch('portfolio/src/pages/Skills.tsx', 'Skills.tsx', text, index)
    }
  })

  experiences.forEach((exp, index) => {
    const text = `${exp.company} ${exp.title} ${exp.bullets.join(' ')}`
    if (text.toLowerCase().includes(normalized.toLowerCase())) {
      addMatch('portfolio/src/pages/Experience.tsx', 'Experience.tsx', text, index)
    }
  })

  return matches
}
