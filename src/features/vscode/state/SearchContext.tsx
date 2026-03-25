import { createContext, useContext, useState } from 'react'

type SearchContextValue = {
  query: string
  setQuery: (value: string) => void
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined)

export const SearchProvider = ({ children }: { children: React.ReactNode }) => {
  const [query, setQuery] = useState('')
  return <SearchContext.Provider value={{ query, setQuery }}>{children}</SearchContext.Provider>
}

export const useSearchHighlight = () => {
  const context = useContext(SearchContext)
  if (!context) throw new Error('useSearchHighlight must be used within SearchProvider')
  return context
}
