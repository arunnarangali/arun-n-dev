import { useEffect, useMemo, useRef, useState } from 'react'
import { commandItems } from '../data/commands'
import { Icon } from './Icon'

type CommandPaletteProps = {
  open: boolean
  onClose: () => void
  onSelectCommand: (id: string) => void
}

export const CommandPalette = ({ open, onClose, onSelectCommand }: CommandPaletteProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
      setQuery('')
      setActiveIndex(0)
    }
  }, [open])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return commandItems
    return commandItems.filter((item) =>
      item.label.toLowerCase().includes(normalized) || item.id.toLowerCase().includes(normalized),
    )
  }, [query])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-xl overflow-hidden rounded-lg border border-outline-variant bg-surface-container-highest shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-2">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                setActiveIndex((index) => (filtered.length ? (index + 1) % filtered.length : 0))
              } else if (event.key === 'ArrowUp') {
                event.preventDefault()
                setActiveIndex((index) => (filtered.length ? (index - 1 + filtered.length) % filtered.length : 0))
              } else if (event.key === 'Enter') {
                event.preventDefault()
                const target = filtered[activeIndex]
                if (target) {
                  onSelectCommand(target.id)
                  onClose()
                }
              } else if (event.key === 'Escape') {
                onClose()
              }
            }}
            className="w-full rounded bg-surface-container-lowest px-3 py-2 font-mono text-[13px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Type a command or search files..."
          />
        </div>
        <div className="max-h-80 overflow-y-auto pb-2">
          {filtered.map((item, index) => {
            const isActive = index === activeIndex
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectCommand(item.id)
                  onClose()
                }}
                className={`flex w-full items-center justify-between px-4 py-2 text-[13px] ${
                  isActive ? 'bg-primary-container text-on-primary' : 'hover:bg-primary-container hover:text-on-primary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon name={item.icon} className={isActive ? 'text-on-primary' : 'text-primary'} />
                  <span>{item.label}</span>
                </div>
                {item.shortcut && <span className="text-[11px] opacity-60">{item.shortcut}</span>}
              </button>
            )
          })}
          {filtered.length === 0 && (
            <div className="px-4 py-3 text-[12px] text-secondary">No matching commands.</div>
          )}
        </div>
      </div>
    </div>
  )
}
