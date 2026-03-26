import { VSCodePortfolio } from '../pages/VSCodePortfolio/VSCodePortfolio'
import { SearchProvider } from '../features/vscode/state/SearchContext'
import { SettingsProvider } from '../features/vscode/state/useSettings'

function App() {
  return (
    <SettingsProvider>
      <SearchProvider>
        <VSCodePortfolio />
      </SearchProvider>
    </SettingsProvider>
  )
}

export default App
