import { useEffect, useRef, useState, type ReactNode } from 'react'
import { analyzeJobFit, formatJobFitReport, sampleJobDescription, type JobFitResult } from '../../../../portfolio/jobFit'
import { useSearchHighlight } from '../../state/useSearchHighlight'
import { useSettings } from '../../state/useSettings'
import { Icon } from '../Icon'

type RunDebugPanelProps = {
  onSelect: (id: string) => void
  variant?: 'sidebar' | 'overlay'
  onClose?: () => void
}

const CONSOLE_LINE_DELAY = 120

const Section = ({ title, count, children }: { title: string; count?: number; children: ReactNode }) => {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-t border-outline-variant">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-1 px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-container"
      >
        <Icon name={open ? 'expand_more' : 'chevron_right'} className="text-[16px]" />
        <span>{title}</span>
        {count !== undefined && <span className="ml-auto rounded bg-surface-container-high px-1.5 text-secondary">{count}</span>}
      </button>
      {open && <div className="px-3 pb-3 normal-case">{children}</div>}
    </div>
  )
}

export const RunDebugPanel = ({ onSelect, variant = 'sidebar', onClose }: RunDebugPanelProps) => {
  const [description, setDescription] = useState('')
  const [result, setResult] = useState<JobFitResult | null>(null)
  const [consoleLines, setConsoleLines] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const timersRef = useRef<number[]>([])
  const { setQuery: setHighlightQuery } = useSearchHighlight()
  const { layout } = useSettings()

  const clearTimers = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []
  }

  useEffect(() => clearTimers, [])

  const launch = () => {
    if (!description.trim()) return
    clearTimers()
    const next = analyzeJobFit(description)
    const report = ['› Launching Job Fit…', ...formatJobFitReport(next)]
    setResult(next)
    setConsoleLines([])
    setCopied(false)
    report.forEach((line, index) => {
      const timer = window.setTimeout(() => setConsoleLines((prev) => [...prev, line]), index * CONSOLE_LINE_DELAY)
      timersRef.current.push(timer)
    })
  }

  const copyReport = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(formatJobFitReport(result).join('\n'))
      setCopied(true)
    } catch (error) {
      console.error('Unable to copy report', error)
    }
  }

  const jumpTo = (fileId: string, term: string) => {
    setHighlightQuery(term)
    onSelect(fileId)
    if (variant === 'overlay') onClose?.()
  }

  const buttonPadding = layout === 'compact' ? 'px-2 py-1' : 'px-3 py-1.5'

  return (
    <aside
      className={`flex flex-col bg-surface-container-low font-mono text-[11px] tracking-wider ${variant === 'overlay' ? 'h-full w-full' : 'w-full'}`}
    >
      <div className="space-y-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={launch}
            disabled={!description.trim()}
            className={`flex items-center gap-1 rounded bg-primary text-on-primary font-bold disabled:opacity-40 ${buttonPadding}`}
          >
            <Icon name="play_arrow" className="text-[16px]" />
            Launch: Job Fit
          </button>
          <button
            onClick={() => setDescription(sampleJobDescription)}
            className={`rounded text-secondary hover:bg-surface-container ${buttonPadding}`}
          >
            Sample JD
          </button>
        </div>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Paste a job description to check fit..."
          rows={layout === 'compact' ? 5 : 7}
          className="vscode-scrollbar w-full resize-y rounded bg-surface-container-lowest px-3 py-2 text-xs normal-case text-on-surface"
        />
      </div>

      {result && (
        <div className="vscode-scrollbar flex-1 overflow-auto text-xs text-on-surface">
          <Section title="Variables">
            <dl className="space-y-1">
              <div className="flex gap-2"><dt className="text-primary">fitScore:</dt><dd className="text-accent">{result.score}%</dd></div>
              <div className="flex gap-2"><dt className="text-primary">experience:</dt><dd>"{result.experience}"</dd></div>
              <div className="flex gap-2"><dt className="text-primary">matched:</dt><dd>[{result.matched.length}]</dd></div>
              {result.topProjects.length > 0 && (
                <div>
                  <dt className="text-primary">bestProjects:</dt>
                  <dd className="pl-3 text-on-surface-variant">{result.topProjects.map((title) => <div key={title}>"{title}"</div>)}</dd>
                </div>
              )}
            </dl>
          </Section>

          <Section title="Breakpoints" count={result.hits.length}>
            {result.hits.length === 0 && <p className="text-on-surface-variant">No matches.</p>}
            <div className="space-y-1">
              {result.hits.map((hit) =>
                hit.groups.map((group) => (
                  <button
                    key={`${hit.term}-${group.fileId}`}
                    onClick={() => jumpTo(group.fileId, hit.term)}
                    className="flex w-full items-center gap-2 rounded bg-surface-container-lowest px-2 py-1.5 text-left hover:bg-surface-container"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full bg-error" />
                    <span className="text-on-surface">{hit.term}</span>
                    <span className="ml-auto text-[10px] text-secondary">
                      {group.fileName}:{group.matches.map((match) => match.line).join(',')}
                    </span>
                  </button>
                )),
              )}
            </div>
          </Section>

          <Section title="Problems" count={result.missing.length}>
            {result.missing.length === 0 && <p className="text-on-surface-variant">No problems detected.</p>}
            {result.missing.map((term) => (
              <p key={term} className="flex items-start gap-1 py-0.5 text-yellow-500">
                <Icon name="warning" className="text-[14px]" />
                <span>'{term}' not found — learning in progress</span>
              </p>
            ))}
          </Section>

          <Section title="Debug Console">
            <div className="space-y-0.5 rounded bg-[rgb(var(--c-terminal-bg))] p-2">
              {consoleLines.map((line, index) => (
                <p key={index} className={`whitespace-pre-wrap ${line.startsWith('⚠') ? 'text-yellow-500' : line.startsWith('✔') ? 'text-accent' : 'text-secondary'}`}>
                  {line}
                </p>
              ))}
            </div>
            <button onClick={copyReport} className={`mt-2 flex items-center gap-1 rounded text-secondary hover:bg-surface-container ${buttonPadding}`}>
              <Icon name={copied ? 'check' : 'content_copy'} className="text-[14px]" />
              {copied ? 'Copied' : 'Copy report'}
            </button>
          </Section>
        </div>
      )}
    </aside>
  )
}
