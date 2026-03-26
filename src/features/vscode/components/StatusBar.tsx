import { Icon } from './Icon'
import { scmInfo } from '../../../portfolio/scm'
import linksJson from '../../../portfolio/data/links.json'

const links = linksJson as Record<string, string | undefined>

const openLink = (url?: string) => {
  if (!url) return
  window.open(url, '_blank', 'noopener')
}

const btnCls =
  'flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors hover:bg-white/10 active:bg-white/20 cursor-pointer select-none'

export const StatusBar = () => {
  return (
    <footer className="vscode-scrollbar fixed bottom-0 left-0 z-50 flex h-6 w-full overflow-x-auto bg-primary-container px-2 font-mono text-[9px] text-on-primary shadow-lg md:px-3 md:text-[10px]">
      <div className="flex w-max min-w-max items-center gap-2 whitespace-nowrap md:w-full md:min-w-0 md:justify-between">

        {/* Left side */}
        <div className="flex items-center gap-1">
          <button
            className={btnCls}
            onClick={() => openLink(links.repo ?? links.github)}
            title="Open repository on GitHub"
          >
            <Icon name="account_tree" className="text-[12px]" />
            {scmInfo.branchName}
          </button>
          <span className={`${btnCls} cursor-default`} title="Current line and column">
            Line 1, Col 1
          </span>
          <span className={`${btnCls} cursor-default`} title="Indentation">
            Spaces: 2
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 pr-2">
          <span className={`${btnCls} cursor-default`} title="File encoding">UTF-8</span>
          <span className={`${btnCls} cursor-default`} title="End of line sequence">LF</span>
          <button
            className={btnCls}
            onClick={() => openLink('https://react.dev')}
            title="React — open docs"
          >
            React
          </button>
          <button
            className={btnCls}
            onClick={() => openLink('https://www.typescriptlang.org')}
            title="TypeScript — open docs"
          >
            TypeScript
          </button>
          <button
            className={btnCls}
            onClick={() => openLink('https://nodejs.org')}
            title="Node.js — open docs"
          >
            Node
          </button>
          <button
            className={btnCls}
            onClick={() => openLink(links.github)}
            title="Open GitHub profile"
          >
            <Icon name="notifications" className="text-[12px]" />
          </button>
        </div>

      </div>
    </footer>
  )
}
