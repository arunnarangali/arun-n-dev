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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col rounded-md border border-outline-variant/30 bg-surface-container-low shadow-2xl">
        <div className="flex h-10 items-center justify-between border-b border-outline-variant px-4">
          <div className="flex items-center gap-2">
            {icon && <Icon name={icon} className="text-[14px] text-primary" />}
            <span className="font-sans text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{title}</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-surface-container-high hover:text-accent text-on-surface-variant/60"
            aria-label="Close"
          >
            <Icon name="close" className="text-[16px]" />
          </button>
        </div>
        <div className="vscode-scrollbar flex-1 overflow-auto p-5">{children}</div>
      </div>
    </div>
  )
}
