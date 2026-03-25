import { useSearchHighlight } from '../features/vscode/state/SearchContext'
import { highlightText } from '../features/vscode/utils/highlight'
import { projects } from './content'

export const ProjectsSection = () => {
  const { query } = useSearchHighlight()
  return (
    <section id="projects" className="mx-auto w-full max-w-6xl space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">Projects</p>
        <h2 className="text-3xl font-semibold text-white">Selected Shipments</h2>
        <p className="text-sm text-zinc-400">High-impact engagements balancing UX, DX, and measurable outcomes.</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-3">
        {projects.map((project) => (
          <article
            key={project.title}
            className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800/70 bg-[#1b1b1d] shadow-xl shadow-black/40 transition-transform hover:-translate-y-1"
          >
            <div className="h-40 w-full overflow-hidden">
              <img src={project.image} alt={project.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            </div>
            <div className="flex flex-1 flex-col gap-4 p-5 text-white">
              <div>
                <h3 className="text-xl font-semibold">{highlightText(project.title, query)}</h3>
                <p className="mt-2 text-sm text-zinc-400">{highlightText(project.summary, query)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {project.stack.map((tech) => (
                  <span key={tech} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                    {tech}
                  </span>
                ))}
              </div>
              <a href={project.href} className="mt-auto text-sm font-semibold text-emerald-400 hover:text-emerald-300">
                View playbook →
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ProjectsSection
