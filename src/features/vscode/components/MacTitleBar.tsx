import { Icon } from './Icon'

export const MacTitleBar = () => {
  return (
    <header className="flex h-9 w-full items-center justify-between border-b border-outline-variant bg-surface-container-low px-3 text-sm font-medium text-on-surface">
      <div className="flex items-center gap-2">
        <div className="flex gap-2 pr-4">
          <span className="h-3 w-3 rounded-full bg-[#FF5F56]" />
          <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
          <span className="h-3 w-3 rounded-full bg-[#27C93F]" />
        </div>
        <span className="font-headline text-xs tracking-tight text-on-surface/80">portfolio — Visual Studio Code</span>
      </div>
      <div className="flex items-center gap-3 text-primary/80">
        <button className="rounded p-1 transition-colors hover:bg-surface-container-high"><Icon name="splitscreen" /></button>
        <button className="rounded p-1 transition-colors hover:bg-surface-container-high"><Icon name="dock_to_right" /></button>
        <button className="rounded p-1 transition-colors hover:bg-surface-container-high"><Icon name="more_vert" /></button>
      </div>
    </header>
  )
}
