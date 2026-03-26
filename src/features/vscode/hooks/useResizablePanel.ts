import { useCallback, useEffect, useState } from 'react'

type Axis = 'x' | 'y'

type Viewport = {
  width: number
  height: number
}

type UseResizablePanelOptions = {
  axis: Axis
  storageKey: string
  defaultSize: number
  min: number
  getMax: (viewport: Viewport) => number
  enabled: boolean
  invert?: boolean
}

type HandleProps = {
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void
  role: 'separator'
  'aria-orientation': 'horizontal' | 'vertical'
  'aria-label': string
}

export const useResizablePanel = ({
  axis,
  storageKey,
  defaultSize,
  min,
  getMax,
  enabled,
  invert = false,
}: UseResizablePanelOptions) => {
  const isHorizontal = axis === 'x'
  const [viewport, setViewport] = useState<Viewport>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 720,
  }))
  const readInitialSize = useCallback(() => {
    if (typeof window === 'undefined') return defaultSize
    const stored = Number(window.localStorage.getItem(storageKey))
    if (Number.isFinite(stored)) {
      return stored
    }
    return defaultSize
  }, [defaultSize, storageKey])
  const [size, setSize] = useState(() => readInitialSize())
  const [isResizing, setResizing] = useState(false)

  const clamp = useCallback(
    (value: number) => {
      const max = getMax(viewport)
      return Math.min(Math.max(value, min), max)
    },
    [getMax, min, viewport],
  )

  useEffect(() => {
    setSize((current) => clamp(current))
  }, [clamp])

  useEffect(() => {
    if (!enabled || !isResizing) return
    const handlePointerUp = () => {
      setResizing(false)
      document.body.style.removeProperty('cursor')
      document.body.style.removeProperty('user-select')
      window.removeEventListener('pointerup', handlePointerUp)
    }
    window.addEventListener('pointerup', handlePointerUp)
    return () => window.removeEventListener('pointerup', handlePointerUp)
  }, [enabled, isResizing])

  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!enabled) return
    window.localStorage.setItem(storageKey, String(size))
  }, [enabled, size, storageKey])

  const beginResize = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!enabled) return
      event.preventDefault()
      event.stopPropagation()
      const startPos = isHorizontal ? event.clientX : event.clientY
      const startSize = size
      const direction = invert ? -1 : 1
      const handleMove = (moveEvent: PointerEvent) => {
        const currentPos = isHorizontal ? moveEvent.clientX : moveEvent.clientY
        const delta = (currentPos - startPos) * direction
        setSize(clamp(startSize + delta))
      }
      const handlePointerUp = () => {
        setResizing(false)
        document.body.style.removeProperty('cursor')
        document.body.style.removeProperty('user-select')
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handlePointerUp)
      }
      document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'
      setResizing(true)
      window.addEventListener('pointermove', handleMove)
      window.addEventListener('pointerup', handlePointerUp)
    },
    [clamp, enabled, invert, isHorizontal, size],
  )

  const getHandleProps = useCallback((): HandleProps => {
    return {
      onPointerDown: beginResize,
      role: 'separator',
      'aria-orientation': isHorizontal ? 'vertical' : 'horizontal',
      'aria-label': axis === 'x' ? 'Resize sidebar' : 'Resize terminal',
    }
  }, [axis, beginResize, isHorizontal])

  return {
    size,
    setSize: (value: number) => setSize(clamp(value)),
    isResizing,
    getHandleProps,
    viewport,
  }
}
