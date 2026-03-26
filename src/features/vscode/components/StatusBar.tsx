import { Icon } from './Icon'
import { scmInfo } from '../../../portfolio/scm'

export const StatusBar = () => {
  return (
    <footer className="vscode-scrollbar fixed bottom-0 left-0 z-50 flex h-6 w-full overflow-x-auto bg-primary-container px-2 font-mono text-[9px] text-on-primary shadow-lg md:px-3 md:text-[10px]">
      <div className="flex w-max min-w-max items-center gap-4 whitespace-nowrap md:w-full md:min-w-0 md:justify-between">
        <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 px-2">
          <Icon name="account_tree" className="text-[12px]" />
          {scmInfo.branchName}
        </span>
          <span>Line 1, Col 1</span>
          <span>Spaces: 2</span>
        </div>
        <div className="flex items-center gap-2 pr-2">
          <span>UTF-8</span>
          <span>LF</span>
          <span>React</span>
          <span>TypeScript</span>
          <span>Node</span>
          <span className="flex items-center gap-1">
            <Icon name="notifications" className="text-[12px]" />
          </span>
        </div>
      </div>
    </footer>
  )
}
