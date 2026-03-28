import { VSCodePortfolio } from '../pages/VSCodePortfolio/VSCodePortfolio'
import { SearchProvider } from '../features/vscode/state/SearchProvider'
import { SettingsProvider } from '../features/vscode/state/SettingsProvider'

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
