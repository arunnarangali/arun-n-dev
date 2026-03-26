import { useCallback, useState } from 'react'
import { portfolioFiles } from '../data/files'

export type EditorGroupId = 0 | 1

export type EditorMode = 'preview' | 'code'

const DEFAULT_FILE_ID = portfolioFiles[0]?.id ?? ''

type GroupState = {
  tabs: string[]
  activeTabId: string
  mode: EditorMode
}

const createGroupState = (initialId?: string): GroupState => ({
  tabs: initialId ? [initialId] : [],
  activeTabId: initialId ?? '',
  mode: 'preview',
})

const groupIds: EditorGroupId[] = [0, 1]

export const useEditorGroups = () => {
  const [groupCount, setGroupCount] = useState<1 | 2>(1)
  const [activeGroup, setActiveGroup] = useState<EditorGroupId>(0)
  const [groups, setGroups] = useState<Record<EditorGroupId, GroupState>>({
    0: createGroupState(DEFAULT_FILE_ID),
    1: createGroupState(),
  })

  const clampGroupId = useCallback((group: EditorGroupId, count: number) => {
    if (group >= count) {
      return (count - 1) as EditorGroupId
    }
    return group
  }, [])

  const setGroupState = useCallback((group: EditorGroupId, updater: (state: GroupState) => GroupState) => {
    setGroups((current) => ({
      ...current,
      [group]: updater(current[group]),
    }))
  }, [])

  const setActiveTabForGroup = useCallback((group: EditorGroupId, tabId: string) => {
    setGroupState(group, (state) => {
      const exists = state.tabs.includes(tabId)
      const tabs = exists ? state.tabs : [...state.tabs, tabId]
      return {
        ...state,
        tabs,
        activeTabId: tabId,
        mode: 'preview',
      }
    })
    setActiveGroup(group)
  }, [setGroupState])

  const removeTabFromGroup = useCallback(
    (group: EditorGroupId, tabId: string, fallbackId: string): boolean => {
      let becameEmpty = false
      setGroupState(group, (state) => {
        if (!state.tabs.includes(tabId)) return state
        const tabs = state.tabs.filter((id) => id !== tabId)
        let activeTabId = state.activeTabId
        if (activeTabId === tabId) {
          activeTabId = tabs[tabs.length - 1] ?? fallbackId ?? ''
        }
        if (tabs.length === 0) {
          becameEmpty = true
        }
        return {
          ...state,
          tabs,
          activeTabId,
        }
      })
      return becameEmpty
    },
    [setGroupState],
  )

  const removeTabFromAllGroups = useCallback(
    (tabId: string, fallbackId: string) => {
      setGroups((current) => {
        const next = { ...current }
        groupIds.forEach((group) => {
          const state = next[group]
          if (!state.tabs.includes(tabId)) return
          const tabs = state.tabs.filter((id) => id !== tabId)
          const activeTabId = state.activeTabId === tabId ? tabs[tabs.length - 1] ?? fallbackId ?? '' : state.activeTabId
          next[group] = {
            ...state,
            tabs,
            activeTabId,
          }
        })
        return next
      })
    },
    [],
  )

  const toggleGroupMode = useCallback((group: EditorGroupId) => {
    setGroupState(group, (state) => ({
      ...state,
      mode: state.mode === 'preview' ? 'code' : 'preview',
    }))
  }, [setGroupState])

  const setGroupMode = useCallback((group: EditorGroupId, mode: EditorMode) => {
    setGroupState(group, (state) => ({
      ...state,
      mode,
    }))
  }, [setGroupState])

  const addTabToGroup = useCallback((group: EditorGroupId, tabId: string) => {
    setGroupState(group, (state) => {
      if (state.tabs.includes(tabId)) {
        return { ...state, activeTabId: tabId }
      }
      return {
        ...state,
        tabs: [...state.tabs, tabId],
        activeTabId: tabId,
      }
    })
  }, [setGroupState])

  const ensureTabsValid = useCallback((validIds: string[], fallbackId: string) => {
    setGroups((current) => {
      const next = { ...current }
      groupIds.forEach((group) => {
        const state = next[group]
        const filtered = state.tabs.filter((id) => validIds.includes(id))
        if (filtered.length === state.tabs.length) return
        const tabs = filtered.length ? filtered : fallbackId ? [fallbackId] : []
        const activeTabId = tabs.includes(state.activeTabId) ? state.activeTabId : tabs[tabs.length - 1] ?? ''
        next[group] = {
          ...state,
          tabs,
          activeTabId,
        }
      })
      return next
    })
  }, [])

  const setExactGroupCount = useCallback(
    (count: 1 | 2, mirrorSource?: EditorGroupId, fallbackId?: string) => {
      setGroups((current) => {
        const next = { ...current }
        if (count > groupCount) {
          const source = mirrorSource ?? activeGroup
          const sourceState = next[source]
          const groupIndex = 1 as EditorGroupId
          const tabs = sourceState.tabs.length ? [...sourceState.tabs] : fallbackId ? [fallbackId] : []
          const activeTabId = tabs.length
            ? tabs.includes(sourceState.activeTabId)
              ? sourceState.activeTabId
              : tabs[tabs.length - 1]
            : fallbackId ?? ''
          next[groupIndex] = {
            tabs,
            activeTabId,
            mode: sourceState.mode,
          }
        } else if (count < groupCount) {
          const leftState = next[0]
          const rightState = next[1]
          const mergedTabs = Array.from(new Set([...leftState.tabs, ...rightState.tabs]))
          next[0] = {
            ...leftState,
            tabs: mergedTabs,
            activeTabId: rightState.activeTabId || leftState.activeTabId,
          }
          next[1] = createGroupState()
        }
        return next
      })
      setGroupCount(count)
      setActiveGroup((current) => clampGroupId(current, count))
    },
    [activeGroup, clampGroupId, groupCount],
  )

  const collapseGroupAt = useCallback(
    (group: EditorGroupId) => {
      if (groupCount === 1) return
      setGroups((current) => {
        const next = { ...current }
        next[group] = { ...next[0 === group ? 1 : 0] }
        next[1] = createGroupState()
        return next
      })
      setGroupCount(1)
      setActiveGroup(0)
    },
    [groupCount],
  )

  const tabsByGroup = {
    0: groups[0].tabs,
    1: groups[1].tabs,
  } as Record<EditorGroupId, string[]>

  const activeTabByGroup = {
    0: groups[0].activeTabId,
    1: groups[1].activeTabId,
  } as Record<EditorGroupId, string>

  const modeByGroup = {
    0: groups[0].mode,
    1: groups[1].mode,
  } as Record<EditorGroupId, EditorMode>

  return {
    groupCount,
    activeGroup,
    setActiveGroup,
    setExactGroupCount,
    setActiveTabForGroup,
    removeTabFromGroup,
    removeTabFromAllGroups,
    collapseGroup: collapseGroupAt,
    ensureTabsValid,
    toggleGroupMode,
    setGroupMode,
    addTabToGroup,
    tabsByGroup,
    activeTabByGroup,
    modeByGroup,
  }
}
