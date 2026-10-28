import MarkdownPreview from '@uiw/react-markdown-preview'
import { useState } from 'react'
import { Icon } from '../Icon'
import { useSettings } from '../../state/useSettings'
import { getFileById } from '../../data/files'
import type { ChatMessage as ChatMessageType } from '../../../../portfolio/ai/chatClient'

type ChatMessageProps = {
  message: ChatMessageType
  isPending: boolean
  onOpenFile: (id: string) => void
}

export const ChatMessage = ({ message, isPending, onOpenFile }: ChatMessageProps) => {
  const { theme } = useSettings()
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  // Links to portfolio files (e.g. `portfolio/src/pages/Projects.tsx`) open as editor tabs.
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (event.target as HTMLElement).closest('a')
    const href = anchor?.getAttribute('href')
    if (!href) return
    if (getFileById(href)) {
      event.preventDefault()
      onOpenFile(href)
      return
    }
    if (/^https?:|^mailto:|^tel:/.test(href)) {
      event.preventDefault()
      window.open(href, '_blank', 'noopener')
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable; nothing to do.
    }
  }

  return (
    <div className="group/message border-b border-outline-variant/30 px-3 py-3">
      <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold text-on-surface-variant">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full ${isUser ? 'bg-surface-container-high text-on-surface' : 'bg-primary/20 text-primary'}`}
        >
          <Icon name={isUser ? 'person' : 'smart_toy'} className="text-[13px]" />
        </span>
        <span>{isUser ? 'You' : 'Copilot'}</span>
        {!isUser && message.content && !isPending && (
          <button
            onClick={handleCopy}
            className="ml-auto rounded p-0.5 opacity-0 transition-opacity hover:bg-surface-container-high hover:text-accent group-hover/message:opacity-100"
            title="Copy answer"
          >
            <Icon name={copied ? 'check' : 'content_copy'} className="text-[13px]" />
          </button>
        )}
      </div>
      {isUser ? (
        <p className="whitespace-pre-wrap break-words pl-7 text-[13px] text-on-surface">{message.content}</p>
      ) : message.content ? (
        <div className="pl-7" onClick={handleClick}>
          <MarkdownPreview
            source={message.content}
            className="markdown-preview chat-markdown text-[13px] text-on-surface"
            style={{ background: 'transparent' }}
            wrapperElement={{ 'data-color-mode': theme === 'light' ? 'light' : 'dark' }}
          />
        </div>
      ) : (
        <p className="flex items-center gap-2 pl-7 text-[12px] text-on-surface-variant">
          <Icon name="progress_activity" className="animate-spin text-[14px]" />
          Thinking…
        </p>
      )}
    </div>
  )
}
