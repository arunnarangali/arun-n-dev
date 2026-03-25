import { Icon } from './Icon'

export const StatusBar = () => {
  return (
    <footer className="fixed bottom-0 left-0 z-50 flex h-6 w-full items-center justify-between bg-[#007ACC] px-3 font-mono text-[10px] text-white shadow-lg">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1 px-2">
          <Icon name="account_tree" className="text-[12px]" />
          main
        </span>
        <span className="px-1">Line 1, Col 1</span>
        <span className="px-1">Spaces: 2</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="px-2">UTF-8</span>
        <span className="px-2">LF</span>
        <span className="px-2">JSON</span>
        <span className="px-2">React</span>
        <span className="px-2">TypeScript</span>
        <span className="px-2">Node</span>
        <span className="flex items-center gap-1 px-2">
          <Icon name="notifications" className="text-[12px]" />
        </span>
      </div>
    </footer>
  )
}
