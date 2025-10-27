/**
 * 优化版 Vue Tabs Composable
 * 
 * 性能优化要点：
 * 1. 使用 shallowRef 和 shallowReactive 减少深度响应
 * 2. 使用 computed 缓存派生状态
 * 3. 使用 watchEffect 优化依赖追踪
 * 4. 实现虚拟滚动支持
 * 5. 批量更新优化
 */

import {
  computed,
  onMounted,
  onUnmounted,
  shallowRef,
  shallowReactive,
  watchEffect,
  nextTick,
  type Ref,
  type ComputedRef,
  type ShallowRef,
} from 'vue'
import type { Tab, TabConfig, TabManagerConfig } from '../../types'
import { OptimizedTabManager } from '../../core/optimized-manager'

interface UseOptimizedTabsOptions extends TabManagerConfig {
  virtualScroll?: boolean
  visibleCount?: number
  router?: any // Vue Router 实例
}

interface UseOptimizedTabsReturn {
  // 响应式状态
  tabs: ShallowRef<ReadonlyArray<Tab>>
  visibleTabs: ComputedRef<ReadonlyArray<Tab>>
  activeTab: ComputedRef<Tab | undefined>
  activeTabId: ShallowRef<string | null>
  tabsCount: ComputedRef<number>
  canAddTab: ComputedRef<boolean>

  // 操作方法
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
  visibleRange: { start: number; end: number }

  // 管理器实例
  manager: OptimizedTabManager
}

/**
 * 优化版 Vue Tabs Composable
 */
export function useOptimizedTabs(
  options: UseOptimizedTabsOptions = {}
): UseOptimizedTabsReturn {
  const {
    virtualScroll = false,
    visibleCount = 20,
    router,
    ...managerConfig
  } = options

  // 创建管理器
  const manager = new OptimizedTabManager(managerConfig)

  // 使用 shallowRef 优化性能（避免深度响应）
  const tabs = shallowRef<ReadonlyArray<Tab>>(manager.getAllTabs())
  const activeTabId = shallowRef<string | null>(
    manager.getActiveTab()?.id || null
  )

  // 虚拟滚动范围
  const visibleRange = shallowReactive({
    start: 0,
    end: visibleCount,
  })

  // 计算属性（缓存）
  const activeTab = computed(() =>
    tabs.value.find(tab => tab.id === activeTabId.value)
  )

  const visibleTabs = computed(() => {
    if (!virtualScroll) {
      return tabs.value
    }
    return tabs.value.slice(visibleRange.start, visibleRange.end)
  })

  const tabsCount = computed(() => tabs.value.length)

  const canAddTab = computed(() =>
    tabs.value.length < (managerConfig.maxTabs || 10)
  )

  // 同步状态（批量更新）
  let syncPending = false
  const syncState = () => {
    if (syncPending) return

    syncPending = true
    // 使用 nextTick 批量更新
    nextTick(() => {
      tabs.value = manager.getAllTabs()
      const active = manager.getActiveTab()
      activeTabId.value = active?.id || null
      syncPending = false
    })
  }

  // 路由集成
  let routerUnwatch: (() => void) | null = null
  if (router) {
    // 监听路由变化
    routerUnwatch = router.afterEach((to: any) => {
      // 根据路由自动添加或激活标签
      const existingTab = manager.getTabByPath(to.path)

      if (existingTab) {
        manager.activateTab(existingTab.id)
      } else if (canAddTab.value) {
        const tab = manager.addTab({
          title: to.meta?.title || to.name || '未命名',
          path: to.path,
          icon: to.meta?.icon,
          meta: to.meta,
        })
        if (tab) {
          manager.activateTab(tab.id)
        }
      }
    })

    // 监听标签激活，同步路由
    manager.events.on('tab:activate', (event) => {
      if (router.currentRoute.value.path !== event.tab.path) {
        router.push(event.tab.path)
      }
    })
  }

  // 设置事件监听
  const setupEventListeners = () => {
    // 使用优先级确保关键事件优先处理
    const criticalEvents = [
      'tab:add',
      'tab:remove',
      'tab:activate',
    ]

    const normalEvents = [
      'tab:update',
      'tab:reorder',
      'tabs:batch-add',
      'tabs:restored',
    ]

    // 高优先级事件
    const criticalUnsubscribes = criticalEvents.map(type =>
      manager.events.on(type, syncState, { priority: 100 })
    )

    // 普通优先级事件
    const normalUnsubscribes = normalEvents.map(type =>
      manager.events.on(type, syncState, { priority: 50 })
    )

    return [...criticalUnsubscribes, ...normalUnsubscribes]
  }

  // 快捷键处理（优化版）
  const setupShortcuts = () => {
    if (!managerConfig.shortcuts?.enabled) {
      return null
    }

    const shortcuts = {
      closeTab: 'Ctrl+W',
      nextTab: 'Ctrl+Tab',
      prevTab: 'Ctrl+Shift+Tab',
      reopenTab: 'Ctrl+Shift+T',
      ...managerConfig.shortcuts,
    }

    // 使用防抖处理快捷键
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    const handleKeyDown = (e: KeyboardEvent) => {
      // 清除之前的定时器
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      debounceTimer = setTimeout(() => {
        const key = e.key.toLowerCase()
        const ctrl = e.ctrlKey || e.metaKey
        const shift = e.shiftKey

        // 关闭当前标签
        if (ctrl && key === 'w' && !shift) {
          e.preventDefault()
          const active = activeTab.value
          if (active?.closable) {
            manager.removeTab(active.id)
          }
        }

        // 切换标签
        else if (ctrl && key === 'tab') {
          e.preventDefault()
          const currentIndex = tabs.value.findIndex(
            t => t.id === activeTabId.value
          )

          if (shift && currentIndex > 0) {
            // 上一个标签
            manager.activateTab(tabs.value[currentIndex - 1].id)
          } else if (!shift && currentIndex < tabs.value.length - 1) {
            // 下一个标签
            manager.activateTab(tabs.value[currentIndex + 1].id)
          }
        }

        // 重新打开标签
        else if (ctrl && shift && key === 't') {
          e.preventDefault()
          manager.reopenLastClosedTab()
        }

        debounceTimer = null
      }, 50)
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }

  // 生命周期
  let unsubscribes: (() => void)[] = []
  let cleanupShortcuts: (() => void) | null = null

  onMounted(() => {
    syncState()
    unsubscribes = setupEventListeners()
    cleanupShortcuts = setupShortcuts()
  })

  onUnmounted(() => {
    // 清理事件监听
    unsubscribes.forEach(unsubscribe => unsubscribe())

    // 清理快捷键
    if (cleanupShortcuts) {
      cleanupShortcuts()
    }

    // 清理路由监听
    if (routerUnwatch) {
      routerUnwatch()
    }

    // 销毁管理器
    manager.destroy()
  })

  // ========== API 方法 ==========

  const addTab = (config: TabConfig): Tab | null => {
    return manager.addTab(config)
  }

  const addTabs = (configs: TabConfig[]): Tab[] => {
    return manager.batchAddTabs(configs)
  }

  const removeTab = (id: string): void => {
    manager.removeTab(id)
  }

  const updateTab = (id: string, updates: Partial<Tab>): void => {
    manager.updateTab(id, updates)
  }

  const activateTab = (id: string): void => {
    manager.activateTab(id)
  }

  const pinTab = (id: string): void => {
    const tab = manager.getTab(id)
    if (tab && !tab.pinned) {
      manager.updateTab(id, { pinned: true })
    }
  }

  const unpinTab = (id: string): void => {
    const tab = manager.getTab(id)
    if (tab && tab.pinned) {
      manager.updateTab(id, { pinned: false })
    }
  }

  const reorderTabs = (fromIndex: number, toIndex: number): void => {
    manager.reorderTabs(fromIndex, toIndex)
  }

  const closeOtherTabs = (id: string): void => {
    manager.closeOtherTabs(id)
  }

  const closeAllTabs = (): void => {
    // 批量关闭
    const closableTabs = tabs.value.filter(tab => tab.closable && !tab.pinned)
    nextTick(() => {
      closableTabs.forEach(tab => manager.removeTab(tab.id))
    })
  }

  const closeTabsToRight = (id: string): void => {
    const index = tabs.value.findIndex(tab => tab.id === id)
    if (index === -1) return

    const toClose = tabs.value.slice(index + 1).filter(
      tab => tab.closable && !tab.pinned
    )

    nextTick(() => {
      toClose.forEach(tab => manager.removeTab(tab.id))
    })
  }

  const closeTabsToLeft = (id: string): void => {
    const index = tabs.value.findIndex(tab => tab.id === id)
    if (index === -1) return

    const toClose = tabs.value.slice(0, index).filter(
      tab => tab.closable && !tab.pinned
    )

    nextTick(() => {
      toClose.forEach(tab => manager.removeTab(tab.id))
    })
  }

  const reopenLastClosedTab = (): void => {
    manager.reopenLastClosedTab()
  }

  const setVisibleRange = (start: number, end: number): void => {
    visibleRange.start = start
    visibleRange.end = end
    if (virtualScroll) {
      manager.setVisibleRange(start, end)
    }
  }

  return {
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

    // 虚拟滚动
    setVisibleRange,
    visibleRange,

    // 管理器
    manager,
  }
}

/**
 * 导出类型
 */
export type { UseOptimizedTabsReturn, UseOptimizedTabsOptions }

