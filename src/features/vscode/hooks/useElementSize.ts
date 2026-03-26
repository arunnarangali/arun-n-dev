import { useEffect, useState } from 'react'

export const useElementSize = <T extends HTMLElement>() => {
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [element, setElement] = useState<T | null>(null)

  useEffect(() => {
    if (!element) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])

  return { size, setElement }
}
