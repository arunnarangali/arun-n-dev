export type JourneyEntry = { year: string; company: string; role: string; detail: string }
export type ChangeEntry = { type: 'feat' | 'fix' | 'chore'; message: string; date: string }

export const careerJourney: JourneyEntry[] = [
  {
    year: '2025',
    company: 'CloudForge Labs',
    role: 'Principal Frontend Engineer',
    detail: 'Promoted to lead platform design system strategy and DX initiatives.',
  },
  {
    year: '2024',
    company: 'Latitude Data',
    role: 'Lead React Engineer',
    detail: 'Delivered 3 production analytics dashboards with 99.9% uptime.',
  },
  {
    year: '2023',
    company: 'Latitude Data',
    role: 'Senior Frontend Engineer',
    detail: 'Rebooted the React platform and introduced multi-brand theming.',
  },
]

export const changeLog: ChangeEntry[] = [
  { type: 'feat', message: 'Implemented global search architecture', date: '2024-09-12' },
  { type: 'feat', message: 'Shipped scalable admin dashboard for enterprise customers', date: '2024-05-21' },
  { type: 'fix', message: 'Optimized rendering performance across design system tokens', date: '2023-11-02' },
]
