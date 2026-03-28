import { useContext } from 'react'
import { SearchContext } from './searchContext'

export const useSearchHighlight = () => {
  const context = useContext(SearchContext)
  if (!context) throw new Error('useSearchHighlight must be used within SearchProvider')
  return context
}
