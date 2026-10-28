import { useEffect, useRef, useState } from 'react'
import { Icon } from '../Icon'
import { matchSlashCommands } from '../../../../portfolio/ai/slashCommands'

type ChatInputProps = {
  isBusy: boolean
  placeholder: string
  onSubmit: (text: string) => void
  onStop: () => void
  focusSignal?: number
}

export const ChatInput = ({ isBusy, placeholder, onSubmit, onStop, focusSignal }: ChatInputProps) => {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestions = matchSlashCommands(value)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [focusSignal])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }, [value])

  const submit = () => {
    if (!value.trim() || isBusy) return
    onSubmit(value)
    setValue('')
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Tab' && suggestions.length > 0) {
      event.preventDefault()
      setValue(`/${suggestions[0].name} `)
      return
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <div className="relative border-t border-outline-variant p-2">
      {suggestions.length > 0 && (
        <ul className="absolute bottom-full left-2 right-2 mb-1 overflow-hidden rounded-md border border-outline-variant bg-surface-container-high text-[12px] shadow-xl">
          {suggestions.map((command) => (
            <li key={command.name}>
              <button
                onClick={() => {
                  setValue(`/${command.name} `)
                  textareaRef.current?.focus()
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-surface-container-lowest hover:text-accent"
              >
                <span className="font-mono text-primary">/{command.name}</span>
                <span className="text-on-surface-variant">{command.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-end gap-2 rounded-md border border-outline-variant bg-surface-container px-2 py-1.5 focus-within:border-primary">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={placeholder}
          aria-label="Chat message"
          className="max-h-40 flex-1 resize-none bg-transparent text-[13px] text-on-surface outline-none placeholder:text-on-surface-variant/60"
        />
        {isBusy ? (
          <button onClick={onStop} className="rounded p-1 text-error hover:bg-surface-container-high" title="Stop generating">
            <Icon name="stop_circle" className="text-[18px]" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!value.trim()}
            className="rounded p-1 text-primary transition-colors hover:bg-surface-container-high disabled:text-on-surface-variant/40"
            title="Send (Enter)"
          >
            <Icon name="send" className="text-[18px]" />
          </button>
        )}
      </div>
      <p className="mt-1 px-1 text-[10px] text-on-surface-variant/70">Type / for commands · Shift+Enter for a new line · AI can make mistakes</p>
    </div>
  )
}
