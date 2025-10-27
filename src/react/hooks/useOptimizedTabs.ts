/**
 * 优化版 React Tabs Hook
 * 
 * 性能优化要点：
 * 1. 使用 useMemo 和 useCallback 减少重渲染
 * 2. 使用 useTransition 优化批量更新
 * 3. 实现虚拟滚动支持
 * 4. 使用 React.memo 优化组件
 * 5. 防抖/节流操作
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  startTransition,
} from 'react'
import type { Tab, TabConfig, TabManagerConfig } from '../../types'
import { OptimizedTabManager } from '../../core/optimized-manager'

// 性能优化：使用常量避免重复创建
const EMPTY_ARRAY: Tab[] = []
const DEFAULT_CONFIG: TabManagerConfig = {
  maxTabs: 10,
  persist: true,
}

interface UseOptimizedTabsOptions extends TabManagerConfig {
  virtualScroll?: boolean
  visibleCount?: number
  debounceMs?: number
}

interface UseOptimizedTabsReturn {
  // 状态
  tabs: ReadonlyArray<Tab>
  visibleTabs: ReadonlyArray<Tab>
  activeTab: Tab | undefined
  activeTabId: string | null
  tabsCount: number
  canAddTab: boolean

  // 操作方法（都是稳定引用）
  addTab: (config: TabConfig) => Tab | null
  addTabs: (configs: TabConfig[]) => Tab[]
  removeTab: (id: string) => void
  updateTab: (id: string, updates: Partial<Tab>) => void
  activateTab: (id: string) => void
  pinTab: (id: string) => void
  unpinTab: (id: string) => void
  reorderTabs: (fromIndex: number, toIndex: number) => void
  closeOtherTabs: (id: string) => void
  closeAllTabs: () => void
  closeTabsToRight: (id: string) => void
  closeTabsToLeft: (id: string) => void
  reopenLastClosedTab: () => void

  // 虚拟滚动
  setVisibleRange: (start: number, end: number) => void

  // 管理器实例（高级用法）
  manager: OptimizedTabManager
}

/**
 * 优化版 Tabs Hook
 */
export function useOptimizedTabs(
  options: UseOptimizedTabsOptions = {}
): UseOptimizedTabsReturn {
  const {
    virtualScroll = false,
    visibleCount = 20,
    debounceMs = 100,
    ...managerConfig
  } = options

  // 使用 useRef 保持管理器实例稳定
  const managerRef = useRef<OptimizedTabManager>()
  const [isPending, startTransition] = useTransition()

  // 懒初始化管理器
  if (!managerRef.current) {
    managerRef.current = new OptimizedTabManager({
      ...DEFAULT_CONFIG,
      ...managerConfig,
    })
  }

  const manager = managerRef.current

  // 状态
  const [tabs, setTabs] = useState<ReadonlyArray<Tab>>(manager.getAllTabs())
  const [activeTabId, setActiveTabId] = useState<string | null>(
    manager.getActiveTab()?.id || null
  )
  const [visibleRange, setVisibleRangeState] = useState({ start: 0, end: visibleCount })

  // 派生状态（使用 useMemo 优化）
  const activeTab = useMemo(
    () => tabs.find(tab => tab.id === activeTabId),
    [tabs, activeTabId]
  )

  const visibleTabs = useMemo(() => {
    if (!virtualScroll) {
      return tabs
    }
    return tabs.slice(visibleRange.start, visibleRange.end)
  }, [tabs, visibleRange, virtualScroll])

  const tabsCount = tabs.length
  const canAddTab = tabsCount < (managerConfig.maxTabs || 10)

  // 同步状态（优化版）
  const syncState = useCallback(() => {
    // 使用 startTransition 优化大量更新
    startTransition(() => {
      setTabs(manager.getAllTabs())
      const active = manager.getActiveTab()
      setActiveTabId(active?.id || null)
    })
  }, [manager])

  // 设置事件监听
  useEffect(() => {
    // 批量订阅事件
    const eventTypes = [
      'tab:add',
      'tab:remove',
      'tab:update',
      'tab:activate',
      'tab:reorder',
      'tabs:batch-add',
      'tabs:restored',
    ]

    const unsubscribes = eventTypes.map(type =>
      manager.events.on(type, syncState, { priority: 10 })
    )

    // 初始同步
    syncState()

    // 清理
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe())
    }
  }, [manager, syncState])

  // 清理资源
  useEffect(() => {
    return () => {
      // 组件卸载时销毁管理器
      if (managerRef.current) {
        managerRef.current.destroy()
      }
    }
  }, [])

  // ========== 稳定的操作方法 ==========

  const addTab = useCallback((config: TabConfig): Tab | null => {
    return manager.addTab(config)
  }, [manager])

  const addTabs = useCallback((configs: TabConfig[]): Tab[] => {
    return manager.batchAddTabs(configs)
  }, [manager])

  const removeTab = useCallback((id: string) => {
    manager.removeTab(id)
  }, [manager])

  const updateTab = useCallback((id: string, updates: Partial<Tab>) => {
    manager.updateTab(id, updates)
  }, [manager])

  const activateTab = useCallback((id: string) => {
    manager.activateTab(id)
  }, [manager])

  const pinTab = useCallback((id: string) => {
    const tab = manager.getTab(id)
    if (tab && !tab.pinned) {
      manager.updateTab(id, { pinned: true })
    }
  }, [manager])

  const unpinTab = useCallback((id: string) => {
    const tab = manager.getTab(id)
    if (tab && tab.pinned) {
      manager.updateTab(id, { pinned: false })
    }
  }, [manager])

  const reorderTabs = useCallback((fromIndex: number, toIndex: number) => {
    manager.reorderTabs(fromIndex, toIndex)
  }, [manager])

  const closeOtherTabs = useCallback((id: string) => {
    manager.closeOtherTabs(id)
  }, [manager])

  const closeAllTabs = useCallback(() => {
    // 批量关闭
    startTransition(() => {
      const closableTabs = tabs.filter(tab => tab.closable && !tab.pinned)
      closableTabs.forEach(tab => manager.removeTab(tab.id))
    })
  }, [manager, tabs])

  const closeTabsToRight = useCallback((id: string) => {
    const index = tabs.findIndex(tab => tab.id === id)
    if (index === -1) return

    startTransition(() => {
      const toClose = tabs.slice(index + 1).filter(tab => tab.closable && !tab.pinned)
      toClose.forEach(tab => manager.removeTab(tab.id))
    })
  }, [manager, tabs])

  const closeTabsToLeft = useCallback((id: string) => {
    const index = tabs.findIndex(tab => tab.id === id)
    if (index === -1) return

    startTransition(() => {
      const toClose = tabs.slice(0, index).filter(tab => tab.closable && !tab.pinned)
      toClose.forEach(tab => manager.removeTab(tab.id))
    })
  }, [manager, tabs])

  const reopenLastClosedTab = useCallback(() => {
    manager.reopenLastClosedTab()
  }, [manager])

  const setVisibleRange = useCallback((start: number, end: number) => {
    setVisibleRangeState({ start, end })
    if (virtualScroll) {
      manager.setVisibleRange(start, end)
    }
  }, [manager, virtualScroll])

  // 返回稳定的API
  return useMemo(() => ({
    // 状态
    tabs,
    visibleTabs,
    activeTab,
    activeTabId,
    tabsCount,
    canAddTab,

    // 方法
    addTab,
    addTabs,
    removeTab,
    updateTab,
    activateTab,
    pinTab,
    unpinTab,
    reorderTabs,
    closeOtherTabs,
    closeAllTabs,
    closeTabsToRight,
    closeTabsToLeft,
    reopenLastClosedTab,
    setVisibleRange,

    // 管理器
    manager,
  }), [
    tabs,
    visibleTabs,
    activeTab,
    activeTabId,
    tabsCount,
    canAddTab,
    addTab,
    addTabs,
    removeTab,
    updateTab,
    activateTab,
    pinTab,
    unpinTab,
    reorderTabs,
    closeOtherTabs,
    closeAllTabs,
    closeTabsToRight,
    closeTabsToLeft,
    reopenLastClosedTab,
    setVisibleRange,
    manager,
  ])
}

/**
 * 导出类型
 */
export type { UseOptimizedTabsReturn, UseOptimizedTabsOptions }

