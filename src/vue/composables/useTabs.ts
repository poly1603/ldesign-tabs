/**
 * Vue Composable for Tabs
 */

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { Ref } from 'vue'
import { createTabManager, createRouterIntegration, createDragHandler } from '../../core'
import type { Tab, TabConfig, TabsConfig, TabEventType } from '../../types'
import { parseShortcut } from '../../utils'

/**
 * useTabs composable
 */
export function useTabs(config: TabsConfig = {}, router?: any) {
  // 创建管理器
  const manager = createTabManager(config)

  // 响应式状态
  const tabs = ref<Tab[]>([])
  const activeTabId = ref<string | null>(null)

  // 路由集成
  let routerIntegration: ReturnType<typeof createRouterIntegration> | null = null
  if (router && config.router?.autoSync !== false) {
    routerIntegration = createRouterIntegration(manager, router, config.router)
  }

  // 拖拽处理器
  const dragHandler = createDragHandler(manager, config.drag)

  // 同步状态
  const syncState = () => {
    tabs.value = manager.getAllTabs()
    const activeTab = manager.getActiveTab()
    activeTabId.value = activeTab?.id || null
  }

  // 事件监听
  const setupEventListeners = () => {
    // 监听所有变更事件并同步状态
    const eventTypes: TabEventType[] = [
      'tab:add',
      'tab:remove',
      'tab:update',
      'tab:activate',
      'tab:pin',
      'tab:unpin',
      'tab:reorder',
      'tabs:restored',
    ]

    eventTypes.forEach((type) => {
      manager.events.on(type, syncState)
    })
  }

  // 快捷键处理
  const setupShortcuts = () => {
    if (!config.shortcuts?.enabled) {
      return
    }

    const shortcuts = {
      closeTab: config.shortcuts.closeTab || 'Ctrl+W',
      nextTab: config.shortcuts.nextTab || 'Ctrl+Tab',
      prevTab: config.shortcuts.prevTab || 'Ctrl+Shift+Tab',
      reopenTab: config.shortcuts.reopenTab || 'Ctrl+Shift+T',
      search: config.shortcuts.search || 'Ctrl+K',
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // 关闭当前标签
      if (parseShortcut(event, shortcuts.closeTab)) {
        event.preventDefault()
        const activeTab = manager.getActiveTab()
        if (activeTab && activeTab.closable) {
          manager.removeTab(activeTab.id)
        }
      }

      // 切换到下一个标签
      else if (parseShortcut(event, shortcuts.nextTab)) {
        event.preventDefault()
        const allTabs = manager.getAllTabs()
        const currentIndex = allTabs.findIndex(t => t.id === activeTabId.value)
        if (currentIndex !== -1 && currentIndex < allTabs.length - 1) {
          manager.activateTab(allTabs[currentIndex + 1].id)
        }
      }

      // 切换到上一个标签
      else if (parseShortcut(event, shortcuts.prevTab)) {
        event.preventDefault()
        const allTabs = manager.getAllTabs()
        const currentIndex = allTabs.findIndex(t => t.id === activeTabId.value)
        if (currentIndex > 0) {
          manager.activateTab(allTabs[currentIndex - 1].id)
        }
      }

      // 重新打开最近关闭的标签
      else if (parseShortcut(event, shortcuts.reopenTab)) {
        event.preventDefault()
        manager.reopenLastClosedTab()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }

  // 生命周期
  let cleanupShortcuts: (() => void) | undefined

  onMounted(() => {
    syncState()
    setupEventListeners()
    cleanupShortcuts = setupShortcuts()
  })

  onUnmounted(() => {
    if (cleanupShortcuts) {
      cleanupShortcuts()
    }
    if (routerIntegration) {
      routerIntegration.destroy()
    }
    dragHandler.destroy()
  })

  // API
  return {
    // 状态
    tabs,
    activeTabId,

    // 计算属性
    activeTab: computed(() => manager.getActiveTab()),
    tabsCount: computed(() => tabs.value.length),
    canAddTab: computed(() => manager.canAddTab()),

    // 方法
    addTab: (tabConfig: TabConfig) => {
      const tab = manager.addTab(tabConfig)
      syncState()
      return tab
    },

    removeTab: (id: string) => {
      const result = manager.removeTab(id)
      syncState()
      return result
    },

    updateTab: (id: string, updates: Partial<Tab>) => {
      const result = manager.updateTab(id, updates)
      syncState()
      return result
    },

    activateTab: (id: string) => {
      const result = manager.activateTab(id)
      syncState()
      return result
    },

    pinTab: (id: string) => {
      const result = manager.pinTab(id)
      syncState()
      return result
    },

    unpinTab: (id: string) => {
      const result = manager.unpinTab(id)
      syncState()
      return result
    },

    reorderTabs: (fromIndex: number, toIndex: number) => {
      const result = manager.reorderTabs(fromIndex, toIndex)
      syncState()
      return result
    },

    closeOtherTabs: (id: string) => {
      const result = manager.closeOtherTabs(id)
      syncState()
      return result
    },

    closeAllTabs: () => {
      const result = manager.closeAllTabs()
      syncState()
      return result
    },

    closeTabsToRight: (id: string) => {
      const result = manager.closeTabsToRight(id)
      syncState()
      return result
    },

    closeTabsToLeft: (id: string) => {
      const result = manager.closeTabsToLeft(id)
      syncState()
      return result
    },

    reopenLastClosedTab: () => {
      const tab = manager.reopenLastClosedTab()
      syncState()
      return tab
    },

    getClosedHistory: () => manager.getClosedHistory(),

    clearHistory: () => manager.clearHistory(),

    // 事件监听
    on: manager.events.on.bind(manager.events),
    once: manager.events.once.bind(manager.events),
    off: manager.events.off.bind(manager.events),

    // 管理器实例（高级用法）
    manager,
    dragHandler,
  }
}

/**
 * 导出类型
 */
export type UseTabsReturn = ReturnType<typeof useTabs>











