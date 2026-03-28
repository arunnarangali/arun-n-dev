import { createContext } from 'react'

export type SearchContextValue = {
  query: string
  setQuery: (value: string) => void
}

export const SearchContext = createContext<SearchContextValue | undefined>(undefined)
