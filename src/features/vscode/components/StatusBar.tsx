import { Icon } from './Icon'
import { scmInfo } from '../../../portfolio/scm'
import linksJson from '../../../portfolio/data/links.json'

const links = linksJson as Record<string, string | undefined>

const openLink = (url?: string) => {
  if (!url) return
  window.open(url, '_blank', 'noopener')
}

const btnCls =
  'flex items-center gap-1.5 px-3 py-1 transition-colors hover:text-accent active:text-accent/80 cursor-pointer select-none'

export const StatusBar = () => {
  return (
    <footer className="vscode-scrollbar fixed bottom-0 left-0 z-50 flex h-[22px] w-full overflow-x-auto bg-primary-container font-sans text-[11px] text-on-primary shadow-lg">
      <div className="flex w-full min-w-max items-center justify-between whitespace-nowrap">

        {/* Left side */}
        <div className="flex h-full items-center">
          <button
            className="flex h-full items-center gap-1.5 bg-accent/20 px-3 transition-colors hover:bg-accent/30"
            onClick={() => openLink(links.repo ?? links.github)}
            title="Open repository on GitHub"
          >
            <Icon name="account_tree" className="text-[14px]" />
            <span className="font-medium">{scmInfo.branchName}</span>
          </button>
          
          <button className={btnCls} title="Synchronize Changes">
            <Icon name="sync" className="text-[14px]" />
          </button>

          <button className={btnCls} title="0 Errors, 0 Warnings">
            <div className="flex items-center gap-1">
              <Icon name="error" className="text-[12px]" />
              <span>0</span>
              <Icon name="warning" className="text-[12px]" />
              <span>0</span>
            </div>
          </button>
        </div>

        {/* Right side */}
        <div className="flex h-full items-center">
          <span className={btnCls} title="Current line and column">Ln 1, Col 1</span>
          <span className={btnCls} title="Indentation">Spaces: 2</span>
          <span className={btnCls} title="File encoding">UTF-8</span>
          <span className={btnCls} title="End of line sequence">LF</span>
          
          <button
            className={btnCls}
            onClick={() => openLink('https://react.dev')}
            title="Powered by React"
          >
            React
          </button>
          
          <button
            className={btnCls}
            onClick={() => openLink(links.github)}
            title="Notifications"
          >
            <Icon name="notifications" className="text-[14px]" />
          </button>
        </div>

      </div>
    </footer>
  )
}
