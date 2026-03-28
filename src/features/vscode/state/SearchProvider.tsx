import type { ReactNode } from 'react'
import { useState } from 'react'
import { SearchContext } from './searchContext'

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [query, setQuery] = useState('')
  return <SearchContext.Provider value={{ query, setQuery }}>{children}</SearchContext.Provider>
}
