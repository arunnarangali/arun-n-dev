import { type ReactNode } from 'react'
import * as Si from 'react-icons/si'
import * as Fi from 'react-icons/fi'

const skillIconMap: Record<string, ReactNode> = {
  'React.js': <Si.SiReact />,
  'TypeScript': <Si.SiTypescript />,
  'JavaScript': <Si.SiJavascript />,
  'Tailwind CSS': <Si.SiTailwindcss />,
  'Redux': <Si.SiRedux />,
  'Framer Motion': <Si.SiFramer />,
  'Golang': <Si.SiGo />,
  'Node.js': <Si.SiNodedotjs />,
  'MongoDB': <Si.SiMongodb />,
  'Express.js': <Si.SiExpress />,
  'Vite': <Si.SiVite />,
  'Git': <Si.SiGit />,
  'Webpack': <Si.SiWebpack />,
  'Postmen': <Si.SiPostman />,
  'Kafka': <Si.SiApachekafka />,
  'ClickHouse': <Si.SiClickhouse />,
  'SQL': <Si.SiMysql />,
  'PostgreSQL': <Si.SiPostgresql />,
  'REST APIs': <Fi.FiLink />,
  'Performance Auditing': <Fi.FiActivity />,
  'Unit Testing': <Fi.FiCheckSquare />,
  'Code Reviews': <Si.SiGithub />,
}

const fallbackIcon = <Fi.FiStar />

export const getSkillIcon = (name: string): ReactNode => {
  return skillIconMap[name] || fallbackIcon
}

type SkillChipProps = {
  label: string
}

export const SkillChip = ({ label }: SkillChipProps) => {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-[12px]">{getSkillIcon(label)}</span>
      {label}
    </span>
  )
}
