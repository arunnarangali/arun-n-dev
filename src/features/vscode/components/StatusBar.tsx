import { Icon } from './Icon'

export const StatusBar = () => {
  return (
    <footer className="vscode-scrollbar fixed bottom-0 left-0 z-50 flex h-6 w-full items-center overflow-x-auto bg-[#007ACC] px-2 font-mono text-[9px] text-white shadow-lg md:px-3 md:text-[10px]">
      <div className="flex items-center gap-3 whitespace-nowrap pb-0.5 pr-4">
        <span className="flex items-center gap-1 px-2">
          <Icon name="account_tree" className="text-[12px]" />
          main
        </span>
        <span>Line 1, Col 1</span>
        <span>Spaces: 2</span>
        <span>UTF-8</span>
        <span>LF</span>
        <span>React</span>
        <span>TypeScript</span>
        <span>Node</span>
        <span className="flex items-center gap-1">
          <Icon name="notifications" className="text-[12px]" />
        </span>
      </div>
    </footer>
  )
}
