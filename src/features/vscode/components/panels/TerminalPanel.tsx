import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PortfolioFile } from '../../data/files'
import type { Layout, Theme } from '../../state/useSettings'
import { Icon } from '../Icon'
import { aboutContent, experiences, heroContent, projects, skillGroups } from '../../../../portfolio/content'
import { useResizablePanel } from '../../hooks/useResizablePanel'

type TerminalPanelProps = {
  open: boolean
  onClose: () => void
  files: PortfolioFile[]
  onOpenFile: (id: string) => void
  theme: Theme
  layout: Layout
  setTheme: (theme: Theme) => void
  setLayout: (layout: Layout) => void
  links: Record<string, string | undefined>
}

type TerminalLine = {
  id: string
  content: string
  variant: 'input' | 'output' | 'system' | 'banner' | 'meta'
}

const MIN_TERMINAL_HEIGHT = 160

const createId = () => `line-${Math.random().toString(36).slice(2, 9)}`

const promptUser = aboutContent.name.split(' ')[0]?.toLowerCase() ?? 'dev'
const promptLabel = `${promptUser}@portfolio`

const formatIntroLines = (): TerminalLine[] => {
  const topExperience = experiences[0]
  const systemsMetric = heroContent.metrics?.find((metric) => metric.label.toLowerCase().includes('systems'))?.value ?? '24'
  const highlights = aboutContent.highlights.slice(0, 2).join(' · ')
  const banner = [
    '        █████╗ ██████╗ ██╗   ██╗███╗   ██╗    ███╗   ██╗',
    '       ██╔══██╗██╔══██╗██║   ██║████╗  ██║    ████╗  ██║',
    '       ███████║██████╔╝██║   ██║██╔██╗ ██║    ██╔██╗ ██║',
    '       ██╔══██║██╔══██╗██║   ██║██║╚██╗██║    ██║╚██╗██║',
    '       ██║  ██║██║  ██║╚██████╔╝██║ ╚████║    ██║ ╚████║',
    '       ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝    ╚═╝  ╚═══╝',
  ].join('\n')

  return [
    { id: createId(), content: banner, variant: 'banner' },
    { id: createId(), content: aboutContent.role, variant: 'meta' },
    topExperience
      ? {
        id: createId(),
        content: `${topExperience.title} @ ${topExperience.company} · ${systemsMetric}+ launches`,
        variant: 'meta',
      }
      : { id: createId(), content: `${systemsMetric}+ systems delivered across DX platforms`, variant: 'meta' },
    highlights ? { id: createId(), content: highlights, variant: 'meta' } : null,
    { id: createId(), content: '...is now installed!', variant: 'system' },
    { id: createId(), content: 'Tip: try `help`, `update`, or `open Projects.tsx` to explore.', variant: 'system' },
  ].filter(Boolean) as TerminalLine[]
}

const themeOptions: Theme[] = ['dark', 'light', 'highContrast']
const layoutOptions: Layout[] = ['comfortable', 'compact']

const clampValue = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export const TerminalPanel = ({
  open,
  onClose,
  files,
  onOpenFile,
  setTheme,
  setLayout,
  links,
}: TerminalPanelProps) => {
  const [lines, setLines] = useState<TerminalLine[]>(() => formatIntroLines())
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const historyIndexRef = useRef<number | null>(null)
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  }))
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isMobile = viewport.width < 768

  const portfolioUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.location.href
    }
    return links.website ?? links.github ?? ''
  }, [links.github, links.website])

  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const terminalResize = useResizablePanel({
    axis: 'y',
    storageKey: 'vscode-terminal-height',
    defaultSize: Math.round((typeof window !== 'undefined' ? window.innerHeight : 800) * 0.22),
    min: MIN_TERMINAL_HEIGHT,
    getMax: ({ height }) => height * 0.8,
    enabled: !isMobile,
    invert: true,
  })

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  useEffect(() => {
    if (!scrollRef.current) return
    // If it's just the initial banner or the terminal was cleared, scroll to top.
    // Otherwise, follow the latest commands at the bottom.
    if (lines.length <= 6) {
      scrollRef.current.scrollTop = 0
    } else {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines])

  const appendLine = useCallback((content: string, variant: TerminalLine['variant']) => {
    setLines((prev) => [...prev, { id: createId(), content, variant }])
  }, [])

  const appendLines = useCallback((entries: string[], variant: TerminalLine['variant']) => {
    setLines((prev) => [...prev, ...entries.map((content) => ({ id: createId(), content, variant }))])
  }, [])

  const clearTerminal = useCallback(() => {
    setLines(formatIntroLines())
  }, [])

  const copyToClipboard = useCallback(
    async (value: string) => {
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(value)
        } else {
          const helper = document.createElement('textarea')
          helper.value = value
          helper.style.position = 'fixed'
          helper.style.opacity = '0'
          document.body.appendChild(helper)
          helper.focus()
          helper.select()
          document.execCommand('copy')
          document.body.removeChild(helper)
        }
        appendLine('Clipboard updated.', 'system')
      } catch (error) {
        console.error('Unable to copy text', error)
        appendLine('Clipboard unavailable.', 'output')
      }
    },
    [appendLine],
  )

  const openLink = useCallback(
    (url?: string) => {
      if (!url) {
        appendLine('Link unavailable.', 'output')
        return
      }
      window.open(url, '_blank', 'noopener')
      appendLine(`Opened ${url}`, 'system')
    },
    [appendLine],
  )

  const openFile = useCallback(
    (query: string) => {
      const normalized = query.toLowerCase()
      const target = files.find(
        (file) => file.id.toLowerCase() === normalized || file.name.toLowerCase() === normalized || file.name.toLowerCase().includes(normalized),
      )
      if (!target) {
        appendLine(`Could not find file: ${query}`, 'output')
        return
      }
      onOpenFile(target.id)
      appendLine(`Focused ${target.name}`, 'system')
    },
    [appendLine, files, onOpenFile],
  )

  const runCommand = useCallback(
    async (rawCommand: string) => {
      const trimmed = rawCommand.trim()
      if (!trimmed) return
      appendLine(trimmed, 'input')
      const [base, ...rest] = trimmed.split(' ')
      const arg = rest.join(' ').trim()
      switch (base.toLowerCase()) {
        case 'help':
          appendLines(
            [
              'Commands:',
              '- help · Show this guide',
              '- clear · Reset terminal output',
              '- open <file> · Focus a portfolio file',
              '- theme <dark|light|highContrast> · Switch UI theme',
              '- layout <comfortable|compact> · Adjust density',
              '- whoami · Display profile summary',
              '- experience · Show recent roles',
              '- skills · List core stacks',
              '- projects · Highlight current builds',
              '- update · Fetch build + status logs',
              '- install · Simulate dependency sync',
              '- url | copy url · Share portfolio link',
              '- github | linkedin | repo | resume · Open respective links',
            ],
            'output',
          )
          break
        case 'clear':
          clearTerminal()
          break
        case 'echo':
          appendLine(arg || '', 'output')
          break
        case 'date':
          appendLine(new Date().toLocaleString(), 'output')
          break
        case 'whoami':
          appendLines([
            `${aboutContent.name} — ${aboutContent.role}`,
            'Partnering with teams on resilient DX & design-systems initiatives.',
          ], 'output')
          break
        case 'experience':
          appendLines(
            experiences.map((entry) => `${entry.period} · ${entry.title} @ ${entry.company}`),
            'output',
          )
          break
        case 'skills':
          appendLines(skillGroups.map((group) => `${group.label}: ${group.items.join(', ')}`), 'output')
          break
        case 'projects':
          appendLines(
            projects.slice(0, 2).map((project) => `${project.title} — ${project.summary}`),
            'output',
          )
          break
        case 'update':
          appendLines(
            [
              '› Checking workspace integrity…',
              '› Linting DX playbooks… OK',
              '› Syncing content with dev branch… OK',
              '✔ Portfolio UI, automations, and integrations already up to date.',
            ],
            'output',
          )
          break
        case 'install':
          appendLines(
            [
              '› Installing leadership.trust@latest…',
              '› Installing design-systems.resilience@stable…',
              '✔ Installation complete — teams now shipping faster with guardrails.',
            ],
            'output',
          )
          break
        case 'npm':
          if (arg.startsWith('install')) {
            appendLines(
              [
                'npm WARN audit — devDependencies audited for DX drift.',
                'added 0 packages, removed 0 packages, audited 100% of experiences.',
              ],
              'output',
            )
          } else {
            appendLine('Only `npm install` is supported in this demo shell.', 'output')
          }
          break
        case 'open':
          if (!arg) {
            appendLine('Provide a file name to open.', 'output')
            break
          }
          openFile(arg)
          break
        case 'theme':
          if (themeOptions.includes(arg as Theme)) {
            setTheme(arg as Theme)
            appendLine(`Theme updated to ${arg}.`, 'system')
          } else {
            appendLine('Theme must be dark, light, or highContrast.', 'output')
          }
          break
        case 'layout':
          if (layoutOptions.includes(arg as Layout)) {
            setLayout(arg as Layout)
            appendLine(`Layout updated to ${arg}.`, 'system')
          } else {
            appendLine('Layout must be comfortable or compact.', 'output')
          }
          break
        case 'url':
          appendLine(portfolioUrl || 'URL unavailable', 'output')
          break
        case 'copy':
          if (arg.toLowerCase() === 'url' && portfolioUrl) {
            await copyToClipboard(portfolioUrl)
          } else {
            appendLine('Unsupported copy command.', 'output')
          }
          break
        case 'github':
          openLink(links.github)
          break
        case 'linkedin':
          openLink(links.linkedin)
          break
        case 'repo':
          openLink(links.repo ?? links.github)
          break
        case 'resume':
          openLink('/resume.pdf')
          break
        default:
          appendLine(`Command not found: ${base}`, 'output')
      }
    },
    [appendLine, appendLines, clearTerminal, copyToClipboard, layoutOptions, links.github, links.linkedin, links.repo, onOpenFile, openFile, openLink, portfolioUrl, setLayout, setTheme, themeOptions],
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const command = input.trim()
    if (!command) return
    setHistory((prev) => [...prev, command])
    historyIndexRef.current = null
    setInput('')
    await runCommand(command)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (history.length === 0) return
      const nextIndex = historyIndexRef.current === null ? history.length - 1 : Math.max(0, historyIndexRef.current - 1)
      const command = history[nextIndex]
      if (command !== undefined) {
        setInput(command)
        historyIndexRef.current = nextIndex
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (history.length === 0) return
      if (historyIndexRef.current === null || historyIndexRef.current >= history.length - 1) {
        setInput('')
        historyIndexRef.current = null
        return
      }
      const nextIndex = historyIndexRef.current + 1
      const command = history[nextIndex]
      if (command !== undefined) {
        setInput(command)
        historyIndexRef.current = nextIndex
      } else {
        setInput('')
        historyIndexRef.current = null
      }
    }
  }

  const effectiveHeight = open
    ? isMobile
      ? clampValue(Math.round(viewport.height * 0.35), MIN_TERMINAL_HEIGHT, viewport.height - 100)
      : terminalResize.size
    : 0

  return (
    <div
      className={`group/terminal flex flex-col overflow-hidden bg-surface-container-low transition-[height] duration-200 ease-out ${open ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      style={{ height: open ? `${effectiveHeight}px` : '0px' }}
      aria-hidden={!open}
    >
      {!isMobile && (
        <div className="relative hidden h-3 md:block">
          <div
            className={`absolute left-1/2 top-1/2 h-1 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-outline/40 transition-opacity ${terminalResize.isResizing ? 'opacity-100' : 'opacity-0 group-hover/terminal:opacity-100'
              }`}
            {...terminalResize.getHandleProps()}
          />
        </div>
      )}
      <div className="flex items-center justify-between border-b border-outline-variant px-2 py-1 font-mono text-[11px] uppercase tracking-[0.3em] text-secondary">
        <span>TERMINAL</span>
        <button
          onClick={onClose}
          className="rounded p-1 text-secondary transition-colors hover:bg-surface-container-high hover:text-on-surface"
          aria-label="Close terminal"
        >
          <Icon name="close" className="text-sm" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col bg-[rgb(var(--c-terminal-bg))]">
        <div ref={scrollRef} className="vscode-scrollbar flex-1 overflow-auto px-4 py-3 font-mono text-xs text-on-surface">
          {lines.length === 0 && <p className="text-secondary/70">Session cleared. Type `help` to continue.</p>}
          {lines.map((line) => {
            if (line.variant === 'banner') {
              return (
                <p
                  key={line.id}
                  className={`text-accent ${isMobile ? 'whitespace-normal text-2xl font-semibold leading-tight' : 'whitespace-pre text-[14px] leading-[1.15] tracking-tight md:text-[16px] lg:text-[20px]'
                    }`}
                >
                  {isMobile ? 'Arun N' : line.content}
                </p>
              )
            }
            if (line.variant === 'meta') {
              return (
                <p key={line.id} className="whitespace-pre-wrap text-[14px] text-secondary/70 md:text-[17px]">
                  {line.content}
                </p>
              )
            }
            return (
              <p
                key={line.id}
                className={`whitespace-pre-wrap ${line.variant === 'input'
                  ? 'text-accent'
                  : line.variant === 'system'
                    ? 'text-secondary/70'
                    : 'text-on-surface'
                  }`}
              >
                {line.variant === 'input' ? `${promptLabel} ~ % ${line.content}` : line.content}
              </p>
            )
          })}
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-outline-variant px-4 py-2 font-mono text-xs text-on-surface">
          <span className="text-accent">{promptLabel} ~ %</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-secondary/50 focus:outline-none"
            placeholder="Hi Arun, start out to code..."
            autoComplete="off"
          />
        </form>
      </div>
    </div>
  )
}
