import type { ReactNode } from 'react'
import { Icon } from './Icon'

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  icon?: string
  children: ReactNode
}

export const Modal = ({ isOpen, onClose, title, icon, children }: ModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 flex max-h-[80vh] w-full max-w-lg flex-col rounded-lg bg-[#1B1B1C] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#2a2a2a] px-4 py-3">
          <div className="flex items-center gap-2">
            {icon && <Icon name={icon} className="text-[16px] text-secondary" />}
            <span className="font-mono text-[11px] uppercase tracking-wider text-on-surface">{title}</span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-secondary transition-colors hover:bg-[#2A2A2A] hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div className="vscode-scrollbar flex-1 overflow-auto p-4">{children}</div>
      </div>
    </div>
  )
}
