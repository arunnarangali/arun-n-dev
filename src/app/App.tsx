import { VSCodePortfolio } from '../pages/VSCodePortfolio/VSCodePortfolio'
import { SearchProvider } from '../features/vscode/state/SearchContext'

function App() {
  return (
    <SearchProvider>
      <VSCodePortfolio />
    </SearchProvider>
  )
}

export default App
