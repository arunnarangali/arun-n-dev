import { useEffect, useRef } from 'react'
import { commandItems } from '../data/commands'
import { Icon } from './Icon'

type CommandPaletteProps = {
  open: boolean
  onClose: () => void
}

export const CommandPalette = ({ open, onClose }: CommandPaletteProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

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
            className="w-full rounded bg-surface-container-lowest px-3 py-2 font-mono text-[13px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Type a command or search files..."
          />
        </div>
        <div className="max-h-80 overflow-y-auto pb-2">
          {commandItems.map((item) => (
            <div
              key={item.id}
              className="flex cursor-pointer items-center justify-between px-4 py-2 text-[13px] hover:bg-primary-container hover:text-white"
            >
              <div className="flex items-center gap-3">
                <Icon name={item.icon} className="text-primary" />
                <span>{item.label}</span>
              </div>
              {item.shortcut && <span className="text-[11px] opacity-60">{item.shortcut}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
