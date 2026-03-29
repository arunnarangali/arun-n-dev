import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from './Icon'
import linksJson from '../../../portfolio/data/links.json'
import meta from '../../../portfolio/data/meta.json'

type MacTitleBarProps = {
  isTerminalOpen: boolean
  onToggleTerminal: () => void
  canTogglePreview: boolean
  editorMode: 'preview' | 'code'
  onToggleEditorMode: () => void
  splitToggle?: {
    visible: boolean
    isSplit: boolean
    onToggle: () => void
  }
}

type MenuItem = {
  id: string
  label: string
  icon?: string
  action: () => void
  disabled?: boolean
  subtle?: boolean
}

const links = linksJson as Record<string, string | undefined>

const portfolioUrlFallback = links.website ?? links.github ?? 'https://arun-react.dev'

export const MacTitleBar = ({
  isTerminalOpen,
  onToggleTerminal,
  canTogglePreview,
  editorMode,
  onToggleEditorMode,
  splitToggle,
}: MacTitleBarProps) => {
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const portfolioUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.location.href
    }
    return portfolioUrlFallback
  }, [])

  useEffect(() => {
    if (!isMenuOpen) return
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return
      if (menuRef.current.contains(event.target as Node)) return
      setMenuOpen(false)
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [isMenuOpen])

  useEffect(() => {
    if (!feedback) return
    const timeout = window.setTimeout(() => setFeedback(''), 1800)
    return () => window.clearTimeout(timeout)
  }, [feedback])

  const copyToClipboard = async (value: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = value
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setFeedback('Link copied!')
    } catch (error) {
      console.error('Clipboard unavailable', error)
      setFeedback('Clipboard unavailable')
    }
  }

  const openExternal = (url?: string) => {
    if (!url) return
    window.open(url, '_blank', 'noopener')
    setMenuOpen(false)
  }

  const handleDownloadResume = () => {
    openExternal('ArunCV.pdf')
  }

  const handleShare = async () => {
    const payload = {
      title: meta.title,
      text: meta.description,
      url: portfolioUrl,
    }
    if (navigator?.share) {
      try {
        await navigator.share(payload)
        setMenuOpen(false)
        return
      } catch (error) {
        console.warn('Share cancelled', error)
      }
    }
    await copyToClipboard(portfolioUrl)
  }

  const handleCopyUrl = async () => {
    await copyToClipboard(portfolioUrl)
  }

  const menuItems: MenuItem[] = [
    {
      id: 'copy-url',
      label: 'Copy Portfolio URL',
      icon: 'content_copy',
      action: handleCopyUrl,
    },
    {
      id: 'linkedin',
      label: 'Open LinkedIn Profile',
      icon: 'work',
      action: () => openExternal(links.linkedin),
    },
    {
      id: 'repo',
      label: 'Open GitHub Repository',
      icon: 'integration_instructions',
      action: () => openExternal(links.repo ?? links.github),
    },
    {
      id: 'github-profile',
      label: 'Open GitHub Profile',
      icon: 'terminal',
      action: () => openExternal(links.github),
    },
    {
      id: 'resume',
      label: 'Download Resume (PDF)',
      action: handleDownloadResume,
      subtle: true,
    },
    {
      id: 'share',
      label: 'Share Portfolio',
      icon: 'share',
      action: handleShare,
    },
  ]

  const buttonBase = 'flex h-6 w-6 shrink-0 items-center justify-center rounded transition-all hover:bg-surface-container-high/60 hover:text-accent'

  return (
    <header className="relative flex h-9 w-full items-center justify-between border-b border-outline-variant bg-surface-container-low px-3 text-[12px] font-medium text-on-surface-variant">
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <span className="h-3 w-3 rounded-full bg-[#FF5F56] opacity-90" />
          <span className="h-3 w-3 rounded-full bg-[#FFBD2E] opacity-90" />
          <span className="h-3 w-3 rounded-full bg-[#27C93F] opacity-90" />
        </div>
        <div className="group flex items-center gap-2 font-sans text-[11px] font-medium tracking-tight cursor-default">
          <Icon name="terminal" className="text-[14px] transition-colors group-hover:text-accent" />
          <span className="transition-colors group-hover:text-accent">portfolio — Arun N</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onToggleTerminal}
          className={`${buttonBase} ${isTerminalOpen ? 'text-primary' : ''}`}
          aria-pressed={isTerminalOpen}
          title={isTerminalOpen ? 'Hide terminal' : 'Show terminal'}
        >
          <Icon name="terminal" className="text-[16px]" />
        </button>
        {splitToggle?.visible && (
          <button
            onClick={splitToggle.onToggle}
            className={`${buttonBase} ${splitToggle.isSplit ? 'text-primary' : ''}`}
            aria-pressed={splitToggle.isSplit}
            title={splitToggle.isSplit ? 'Close split editor' : 'Split editor'}
          >
            <Icon name="splitscreen" className="text-[16px]" />
          </button>
        )}
        <button
          onClick={onToggleEditorMode}
          disabled={!canTogglePreview}
          className={`${buttonBase} ${canTogglePreview ? 'text-on-surface-variant' : 'text-secondary/40'} ${editorMode === 'code' ? 'text-primary' : ''}`}
          title={canTogglePreview ? (editorMode === 'preview' ? 'View component code' : 'View live preview') : 'Code preview unavailable'}
        >
          <Icon name={editorMode === 'preview' ? 'dock_to_right' : 'code'} className="text-[16px]" />
        </button>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className={`${buttonBase} ${isMenuOpen ? 'text-primary' : ''}`}
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            title="More actions"
          >
            <Icon name="more_vert" className="text-[16px]" />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-outline-variant bg-surface-container-high text-left shadow-2xl">
              <ul className="py-1 text-[13px] text-on-surface">
                {menuItems.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        item.action()
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-surface-container-lowest hover:text-accent ${item.subtle ? 'font-normal tracking-normal text-on-surface/70' : ''
                        }`}
                    >
                      {item.icon && !item.subtle && <Icon name={item.icon} className="text-sm text-secondary transition-colors group-hover:text-accent" />}
                      <span>{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {feedback && <div className="border-t border-outline-variant px-3 py-2 text-[11px] text-secondary">{feedback}</div>}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
