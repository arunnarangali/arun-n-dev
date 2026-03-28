import { highlightText } from '../../features/vscode/utils/highlight'
import type { ProjectCard as ProjectCardType } from '../content'

type ProjectCardProps = {
  project: ProjectCardType
  query: string
}

export const ProjectCard = ({ project, query }: ProjectCardProps) => {
  return (
    <article
      className="group flex flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low shadow-xl shadow-black/40 transition-transform hover:-translate-y-1"
    >
      <div className="h-48 w-full overflow-hidden">
        <img
          src={project.image}
          alt={project.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5 text-on-surface">
        <div>
          <h3 className="text-xl font-semibold">{highlightText(project.title, query)}</h3>
          <p className="mt-2 text-sm text-on-surface-variant">{highlightText(project.summary, query)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {project.stack.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary"
            >
              {tech}
            </span>
          ))}
        </div>
        <a
          href={project.href}
          className="mt-auto text-sm font-semibold text-primary hover:text-primary-fixed-dim"
        >
          View playbook →
        </a>
      </div>
    </article>
  )
}
