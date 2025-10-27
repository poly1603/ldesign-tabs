/**
 * React Hooks - useTabs
 * 
 * 为 React 应用提供完整的标签页管理功能。
 * 封装了标签管理器的所有核心功能，并提供响应式状态。
 * 
 * @example
 * ```tsx
 * import { useTabs } from '@ldesign/tabs/react'
 * 
 * function App() {
 *   const {
 *     tabs,
 *     activeTabId,
 *     addTab,
 *     removeTab,
 *     activateTab
 *   } = useTabs({
 *     maxTabs: 10,
 *     persist: true
 *   })
 * 
 *   return (
 *     <TabsContainer
 *       tabs={tabs}
 *       activeTabId={activeTabId}
 *       onTabClick={(tab) => activateTab(tab.id)}
 *       onTabClose={(tab) => removeTab(tab.id)}
 *     />
 *   )
 * }
 * ```
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Tab, TabConfig, TabManagerConfig } from '../../types'
import { createTabManager, createDragHandler, type TabManager, type DragHandler } from '../../core'

/**
 * useTabs Hook 配置
 */
export interface UseTabsConfig extends TabManagerConfig {
  /** 是否启用拖拽（默认true） */
  enableDrag?: boolean
  /** 拖拽延迟（毫秒） */
  dragDelay?: number
}

/**
 * useTabs Hook 返回值
 */
export interface UseTabsReturn {
  // 响应式状态
  /** 标签列表 */
  tabs: Tab[]
  /** 当前激活的标签ID */
  activeTabId: string | null
  /** 当前激活的标签对象 */
  activeTab: Tab | undefined
  /** 标签数量 */
  tabsCount: number
  /** 是否可以添加更多标签 */
  canAddTab: boolean

  // 操作方法
  /** 添加标签 */
  addTab: (config: TabConfig) => Tab | null
  /** 移除标签 */
  removeTab: (id: string) => boolean
  /** 更新标签 */
  updateTab: (id: string, updates: Partial<Tab>) => boolean
  /** 激活标签 */
  activateTab: (id: string) => boolean
  /** 固定标签 */
  pinTab: (id: string) => boolean
  /** 取消固定标签 */
  unpinTab: (id: string) => boolean
  /** 重新排序标签 */
  reorderTabs: (fromIndex: number, toIndex: number) => boolean
  /** 关闭其他标签 */
  closeOtherTabs: (id: string) => number
  /** 关闭所有标签 */
  closeAllTabs: () => number
  /** 关闭右侧标签 */
  closeTabsToRight: (id: string) => number
  /** 关闭左侧标签 */
  closeTabsToLeft: (id: string) => number
  /** 重新打开最近关闭的标签 */
  reopenLastClosedTab: () => Tab | null
  /** 获取关闭历史 */
  getClosedHistory: () => Array<{ tab: Tab; closedAt: number; index: number }>
  /** 清除历史 */
  clearHistory: () => void

  // 管理器实例
  /** 标签管理器实例 */
  manager: TabManager
  /** 拖拽处理器实例 */
  dragHandler: DragHandler
}

/**
 * useTabs Hook
 * 
 * React 的标签页管理 Hook，提供完整的标签页功能。
 * 
 * @param config - 配置选项
 * @returns Hook 返回值对象
 * 
 * @example
 * ```tsx
 * function TabsDemo() {
 *   const { tabs, activeTabId, addTab, removeTab, activateTab } = useTabs({
 *     maxTabs: 10,
 *     persist: true,
 *     enableDrag: true
 *   })
 * 
 *   return (
 *     <div>
 *       <button onClick={() => addTab({ title: '新标签', path: '/new' })}>
 *         添加标签
 *       </button>
 *       
 *       {tabs.map(tab => (
 *         <div key={tab.id} onClick={() => activateTab(tab.id)}>
 *           {tab.title}
 *           <button onClick={() => removeTab(tab.id)}>×</button>
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useTabs(config: UseTabsConfig = {}): UseTabsReturn {
  // 创建管理器实例（只创建一次）
  const managerRef = useRef<TabManager>()
  const dragHandlerRef = useRef<DragHandler>()

  if (!managerRef.current) {
    managerRef.current = createTabManager(config)
  }

  if (!dragHandlerRef.current && config.enableDrag !== false) {
    dragHandlerRef.current = createDragHandler(managerRef.current, {
      enabled: config.enableDrag !== false,
      delay: config.dragDelay || 0,
    })
  }

  const manager = managerRef.current
  const dragHandler = dragHandlerRef.current!

  // 响应式状态
  const [tabs, setTabs] = useState<Tab[]>(() => manager.getAllTabs())
  const [activeTabId, setActiveTabId] = useState<string | null>(() => manager.getActiveTab()?.id || null)

  // 监听管理器事件，同步状态
  useEffect(() => {
    const updateState = () => {
      setTabs(manager.getAllTabs())
      setActiveTabId(manager.getActiveTab()?.id || null)
    }

    // 监听所有可能改变状态的事件
    const unsubscribers = [
      manager.events.on('tab:add', updateState),
      manager.events.on('tab:remove', updateState),
      manager.events.on('tab:update', updateState),
      manager.events.on('tab:activate', updateState),
      manager.events.on('tab:pin', updateState),
      manager.events.on('tab:unpin', updateState),
      manager.events.on('tab:reorder', updateState),
      manager.events.on('tabs:restored', updateState),
    ]

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [manager])

  // 计算派生状态
  const activeTab = useMemo(
    () => tabs.find(tab => tab.id === activeTabId),
    [tabs, activeTabId]
  )

  const tabsCount = tabs.length
  const canAddTab = useMemo(
    () => manager.canAddTab(),
    [manager, tabsCount]
  )

  // 包装方法（使用 useCallback 优化性能）
  const addTab = useCallback(
    (tabConfig: TabConfig) => manager.addTab(tabConfig),
    [manager]
  )

  const removeTab = useCallback(
    (id: string) => manager.removeTab(id),
    [manager]
  )

  const updateTab = useCallback(
    (id: string, updates: Partial<Tab>) => manager.updateTab(id, updates),
    [manager]
  )

  const activateTab = useCallback(
    (id: string) => manager.activateTab(id),
    [manager]
  )

  const pinTab = useCallback(
    (id: string) => manager.pinTab(id),
    [manager]
  )

  const unpinTab = useCallback(
    (id: string) => manager.unpinTab(id),
    [manager]
  )

  const reorderTabs = useCallback(
    (fromIndex: number, toIndex: number) => manager.reorderTabs(fromIndex, toIndex),
    [manager]
  )

  const closeOtherTabs = useCallback(
    (id: string) => manager.closeOtherTabs(id),
    [manager]
  )

  const closeAllTabs = useCallback(
    () => manager.closeAllTabs(),
    [manager]
  )

  const closeTabsToRight = useCallback(
    (id: string) => manager.closeTabsToRight(id),
    [manager]
  )

  const closeTabsToLeft = useCallback(
    (id: string) => manager.closeTabsToLeft(id),
    [manager]
  )

  const reopenLastClosedTab = useCallback(
    () => manager.reopenLastClosedTab(),
    [manager]
  )

  const getClosedHistory = useCallback(
    () => manager.getClosedHistory(),
    [manager]
  )

  const clearHistory = useCallback(
    () => manager.clearHistory(),
    [manager]
  )

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      manager.destroy()
      dragHandler?.destroy()
    }
  }, [manager, dragHandler])

  return {
    // 状态
    tabs,
    activeTabId,
    activeTab,
    tabsCount,
    canAddTab,

    // 方法
    addTab,
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
    getClosedHistory,
    clearHistory,

    // 实例
    manager,
    dragHandler,
  }
}


