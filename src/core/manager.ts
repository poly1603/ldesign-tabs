/**
 * 标签页管理器核心类
 */

import { nanoid } from 'nanoid'
import type {
  ClosedTabHistory,
  Tab,
  TabConfig,
  TabEventEmitter,
  TabManagerConfig,
  TabStorage,
} from '../types'
import {
  canAddTab,
  canCloseTab,
  deepClone,
  filterPinnedTabs,
  filterUnpinnedTabs,
  findTabByPath,
  findTabIndex,
  generateId,
  moveArrayItem,
  sanitizeTabConfig,
  validateTabConfig,
  validateTabId,
} from '../utils'
import { EventEmitter } from './event-emitter'
import { createTabStorage } from './storage'

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Required<TabManagerConfig> = {
  maxTabs: 10,
  persist: true,
  persistKey: 'ldesign_tabs',
  defaultTabs: [],
  autoActivate: true,
}

/**
 * 标签页管理器
 */
export class TabManager {
  private tabs: Tab[] = []
  private activeTabId: string | null = null
  private config: Required<TabManagerConfig>
  private storage: TabStorage
  private eventEmitter: TabEventEmitter
  private closedHistory: ClosedTabHistory[] = []

  constructor(config: TabManagerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.storage = createTabStorage(this.config.persistKey)
    this.eventEmitter = new EventEmitter()

    // 尝试从存储恢复状态
    this.restoreFromStorage()

    // 如果没有标签，添加默认标签
    if (this.tabs.length === 0 && this.config.defaultTabs.length > 0) {
      this.config.defaultTabs.forEach(tabConfig => this.addTab(tabConfig))
    }
  }

  /**
   * 获取事件发射器
   */
  get events(): TabEventEmitter {
    return this.eventEmitter
  }

  /**
   * 添加标签
   */
  addTab(config: TabConfig): Tab | null {
    // 验证配置
    const validation = validateTabConfig(config)
    if (!validation.valid) {
      console.error('Invalid tab config:', validation.errors)
      return null
    }

    // 清理配置
    const cleanConfig = sanitizeTabConfig(config)

    // 检查是否超出最大数量
    if (!canAddTab(this.tabs.length, this.config.maxTabs)) {
      this.eventEmitter.emit({
        type: 'tabs:limit-reached',
        timestamp: Date.now(),
        count: this.tabs.length,
        limit: this.config.maxTabs,
      })
      console.warn(`Cannot add tab: reached maximum limit of ${this.config.maxTabs}`)
      return null
    }

    // 检查重复
    const existingTab = findTabByPath(this.tabs, cleanConfig.path)
    if (existingTab) {
      // 如果标签已存在，激活它
      this.activateTab(existingTab.id)
      return existingTab
    }

    // 创建新标签
    const tab: Tab = {
      id: cleanConfig.id || generateId(),
      title: cleanConfig.title,
      path: cleanConfig.path,
      icon: cleanConfig.icon,
      pinned: cleanConfig.pinned || false,
      closable: cleanConfig.closable !== false,
      status: 'normal',
      meta: cleanConfig.meta,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      visitCount: 1,
    }

    // 添加到列表
    if (tab.pinned) {
      // 固定标签添加到固定区域末尾
      const pinnedCount = filterPinnedTabs(this.tabs).length
      this.tabs.splice(pinnedCount, 0, tab)
    }
    else {
      // 普通标签添加到末尾
      this.tabs.push(tab)
    }

    // 发射事件
    this.eventEmitter.emit({
      type: 'tab:add',
      timestamp: Date.now(),
      tab: deepClone(tab),
    })

    // 自动激活
    if (this.config.autoActivate) {
      this.activateTab(tab.id)
    }

    // 持久化
    this.saveToStorage()

    return deepClone(tab)
  }

  /**
   * 移除标签
   */
  removeTab(id: string): boolean {
    if (!validateTabId(id)) {
      return false
    }

    const index = findTabIndex(this.tabs, id)
    if (index === -1) {
      return false
    }

    const tab = this.tabs[index]

    // 检查是否可以关闭
    const isActive = this.activeTabId === id
    if (!canCloseTab(tab, isActive)) {
      console.warn('Cannot close tab:', tab.closable ? 'is active' : 'not closable')
      return false
    }

    // 添加到历史记录
    this.addToHistory(tab, index)

    // 移除标签
    this.tabs.splice(index, 1)

    // 发射事件
    this.eventEmitter.emit({
      type: 'tab:remove',
      timestamp: Date.now(),
      tab: deepClone(tab),
      index,
    })

    // 如果移除的是激活标签，需要激活另一个
    if (isActive) {
      const nextTab = this.tabs[Math.min(index, this.tabs.length - 1)]
      if (nextTab) {
        this.activateTab(nextTab.id)
      }
      else {
        this.activeTabId = null
      }
    }

    // 持久化
    this.saveToStorage()

    return true
  }

  /**
   * 更新标签
   */
  updateTab(id: string, updates: Partial<Tab>): boolean {
    if (!validateTabId(id)) {
      return false
    }

    const index = findTabIndex(this.tabs, id)
    if (index === -1) {
      return false
    }

    const tab = this.tabs[index]
    const oldTab = deepClone(tab)

    // 更新标签
    Object.assign(tab, updates, {
      id: tab.id, // ID 不能修改
      lastAccessedAt: Date.now(),
    })

    // 发射事件
    this.eventEmitter.emit({
      type: 'tab:update',
      timestamp: Date.now(),
      tab: deepClone(tab),
      changes: updates,
    })

    // 如果pinned状态变化，需要重新排序
    if (updates.pinned !== undefined && updates.pinned !== oldTab.pinned) {
      this.sortTabsByPinned()
    }

    // 持久化
    this.saveToStorage()

    return true
  }

  /**
   * 激活标签
   */
  activateTab(id: string): boolean {
    if (!validateTabId(id)) {
      return false
    }

    const tab = this.tabs.find(t => t.id === id)
    if (!tab) {
      return false
    }

    const previousTab = this.activeTabId ? this.tabs.find(t => t.id === this.activeTabId) : undefined

    this.activeTabId = id

    // 更新访问信息
    tab.lastAccessedAt = Date.now()
    tab.visitCount++

    // 发射事件
    this.eventEmitter.emit({
      type: 'tab:activate',
      timestamp: Date.now(),
      tab: deepClone(tab),
      previousTab: previousTab ? deepClone(previousTab) : undefined,
    })

    // 持久化
    this.saveToStorage()

    return true
  }

  /**
   * 固定标签
   */
  pinTab(id: string): boolean {
    if (!validateTabId(id)) {
      return false
    }

    const tab = this.tabs.find(t => t.id === id)
    if (!tab || tab.pinned) {
      return false
    }

    tab.pinned = true

    // 重新排序
    this.sortTabsByPinned()

    // 发射事件
    this.eventEmitter.emit({
      type: 'tab:pin',
      timestamp: Date.now(),
      tab: deepClone(tab),
    })

    // 持久化
    this.saveToStorage()

    return true
  }

  /**
   * 取消固定标签
   */
  unpinTab(id: string): boolean {
    if (!validateTabId(id)) {
      return false
    }

    const tab = this.tabs.find(t => t.id === id)
    if (!tab || !tab.pinned) {
      return false
    }

    tab.pinned = false

    // 发射事件
    this.eventEmitter.emit({
      type: 'tab:unpin',
      timestamp: Date.now(),
      tab: deepClone(tab),
    })

    // 持久化
    this.saveToStorage()

    return true
  }

  /**
   * 重新排序标签
   */
  reorderTabs(fromIndex: number, toIndex: number): boolean {
    if (fromIndex === toIndex) {
      return false
    }

    if (fromIndex < 0 || fromIndex >= this.tabs.length) {
      return false
    }

    if (toIndex < 0 || toIndex >= this.tabs.length) {
      return false
    }

    const fromTab = this.tabs[fromIndex]
    const pinnedCount = filterPinnedTabs(this.tabs).length

    // 验证拖拽：固定标签不能拖到非固定区域
    if (fromTab.pinned && toIndex >= pinnedCount) {
      return false
    }

    // 非固定标签不能拖到固定区域
    if (!fromTab.pinned && toIndex < pinnedCount) {
      return false
    }

    // 移动标签
    this.tabs = moveArrayItem(this.tabs, fromIndex, toIndex)

    // 发射事件
    this.eventEmitter.emit({
      type: 'tab:reorder',
      timestamp: Date.now(),
      tabId: fromTab.id,
      fromIndex,
      toIndex,
    })

    // 持久化
    this.saveToStorage()

    return true
  }

  /**
   * 关闭其他标签
   */
  closeOtherTabs(id: string): number {
    if (!validateTabId(id)) {
      return 0
    }

    const keptTab = this.tabs.find(t => t.id === id)
    if (!keptTab) {
      return 0
    }

    const isActive = this.activeTabId === id
    const closedTabs: Tab[] = []

    // 过滤可关闭的标签
    this.tabs = this.tabs.filter((tab) => {
      if (tab.id === id) {
        return true
      }

      const shouldKeep = !canCloseTab(tab, isActive && tab.id === this.activeTabId)
      if (!shouldKeep) {
        closedTabs.push(deepClone(tab))
        this.addToHistory(tab, -1)
      }

      return shouldKeep
    })

    if (closedTabs.length > 0) {
      // 发射事件
      this.eventEmitter.emit({
        type: 'tab:close-others',
        timestamp: Date.now(),
        closedTabs,
        keptTab: deepClone(keptTab),
      })

      // 持久化
      this.saveToStorage()
    }

    return closedTabs.length
  }

  /**
   * 关闭所有标签
   */
  closeAllTabs(): number {
    const closedTabs: Tab[] = []

    // 过滤可关闭的标签
    this.tabs = this.tabs.filter((tab) => {
      const isActive = this.activeTabId === tab.id
      const shouldKeep = !canCloseTab(tab, isActive)

      if (!shouldKeep) {
        closedTabs.push(deepClone(tab))
        this.addToHistory(tab, -1)
      }

      return shouldKeep
    })

    // 如果激活标签被关闭，激活第一个
    if (this.activeTabId && !this.tabs.find(t => t.id === this.activeTabId)) {
      if (this.tabs.length > 0) {
        this.activateTab(this.tabs[0].id)
      }
      else {
        this.activeTabId = null
      }
    }

    if (closedTabs.length > 0) {
      // 发射事件
      this.eventEmitter.emit({
        type: 'tab:close-all',
        timestamp: Date.now(),
        closedTabs,
      })

      // 持久化
      this.saveToStorage()
    }

    return closedTabs.length
  }

  /**
   * 关闭右侧标签
   */
  closeTabsToRight(id: string): number {
    if (!validateTabId(id)) {
      return 0
    }

    const index = findTabIndex(this.tabs, id)
    if (index === -1) {
      return 0
    }

    const closedTabs: Tab[] = []

    // 关闭右侧可关闭的标签
    for (let i = this.tabs.length - 1; i > index; i--) {
      const tab = this.tabs[i]
      const isActive = this.activeTabId === tab.id

      if (canCloseTab(tab, isActive)) {
        closedTabs.push(deepClone(tab))
        this.addToHistory(tab, i)
        this.tabs.splice(i, 1)
      }
    }

    if (closedTabs.length > 0) {
      // 发射事件
      this.eventEmitter.emit({
        type: 'tab:close-right',
        timestamp: Date.now(),
        closedTabs,
      })

      // 持久化
      this.saveToStorage()
    }

    return closedTabs.length
  }

  /**
   * 关闭左侧标签
   */
  closeTabsToLeft(id: string): number {
    if (!validateTabId(id)) {
      return 0
    }

    const index = findTabIndex(this.tabs, id)
    if (index === -1) {
      return 0
    }

    const closedTabs: Tab[] = []

    // 关闭左侧可关闭的标签
    for (let i = index - 1; i >= 0; i--) {
      const tab = this.tabs[i]
      const isActive = this.activeTabId === tab.id

      if (canCloseTab(tab, isActive)) {
        closedTabs.push(deepClone(tab))
        this.addToHistory(tab, i)
        this.tabs.splice(i, 1)
      }
    }

    if (closedTabs.length > 0) {
      // 发射事件
      this.eventEmitter.emit({
        type: 'tab:close-left',
        timestamp: Date.now(),
        closedTabs,
      })

      // 持久化
      this.saveToStorage()
    }

    return closedTabs.length
  }

  /**
   * 获取标签
   */
  getTab(id: string): Tab | undefined {
    const tab = this.tabs.find(t => t.id === id)
    return tab ? deepClone(tab) : undefined
  }

  /**
   * 获取所有标签
   */
  getAllTabs(): Tab[] {
    return this.tabs.map(tab => deepClone(tab))
  }

  /**
   * 获取激活的标签
   */
  getActiveTab(): Tab | undefined {
    if (!this.activeTabId) {
      return undefined
    }

    const tab = this.tabs.find(t => t.id === this.activeTabId)
    return tab ? deepClone(tab) : undefined
  }

  /**
   * 检查是否有重复标签
   */
  hasDuplicateTab(path: string): boolean {
    return Boolean(findTabByPath(this.tabs, path))
  }

  /**
   * 检查是否可以添加标签
   */
  canAddTab(): boolean {
    return canAddTab(this.tabs.length, this.config.maxTabs)
  }

  /**
   * 获取标签数量
   */
  getTabsCount(): number {
    return this.tabs.length
  }

  /**
   * 获取关闭历史
   */
  getClosedHistory(): ClosedTabHistory[] {
    return [...this.closedHistory]
  }

  /**
   * 恢复最近关闭的标签
   */
  reopenLastClosedTab(): Tab | null {
    const lastClosed = this.closedHistory.pop()
    if (!lastClosed) {
      return null
    }

    // 重新添加标签
    const tab = this.addTab({
      title: lastClosed.tab.title,
      path: lastClosed.tab.path,
      icon: lastClosed.tab.icon,
      pinned: lastClosed.tab.pinned,
      meta: lastClosed.tab.meta,
    })

    // 保存历史
    this.saveHistoryToStorage()

    return tab
  }

  /**
   * 清除历史
   */
  clearHistory(): void {
    this.closedHistory = []
    this.saveHistoryToStorage()
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.eventEmitter.clear()
    this.tabs = []
    this.activeTabId = null
    this.closedHistory = []
  }

  /**
   * 按固定状态排序
   */
  private sortTabsByPinned(): void {
    const pinned = filterPinnedTabs(this.tabs)
    const unpinned = filterUnpinnedTabs(this.tabs)
    this.tabs = [...pinned, ...unpinned]
  }

  /**
   * 添加到历史记录
   */
  private addToHistory(tab: Tab, index: number): void {
    this.closedHistory.push({
      tab: deepClone(tab),
      closedAt: Date.now(),
      index,
    })

    // 保持最多20条
    if (this.closedHistory.length > 20) {
      this.closedHistory.shift()
    }

    this.saveHistoryToStorage()
  }

  /**
   * 保存到存储
   */
  private saveToStorage(): void {
    if (!this.config.persist) {
      return
    }

    this.storage.saveTabs({
      tabs: this.tabs.map(tab => deepClone(tab)),
      activeTabId: this.activeTabId,
      timestamp: Date.now(),
      version: '1.0.0',
    })
  }

  /**
   * 从存储恢复
   */
  private restoreFromStorage(): void {
    if (!this.config.persist) {
      return
    }

    const state = this.storage.loadTabs()
    if (state && state.tabs && Array.isArray(state.tabs)) {
      this.tabs = state.tabs.map(tab => deepClone(tab))
      this.activeTabId = state.activeTabId

      // 发射恢复事件
      this.eventEmitter.emit({
        type: 'tabs:restored',
        timestamp: Date.now(),
        tabs: this.tabs.map(tab => deepClone(tab)),
      })
    }

    // 恢复历史记录
    const history = this.storage.loadHistory()
    if (history && history.closedTabs) {
      this.closedHistory = history.closedTabs
    }
  }

  /**
   * 保存历史到存储
   */
  private saveHistoryToStorage(): void {
    if (!this.config.persist) {
      return
    }

    this.storage.saveHistory({
      closedTabs: this.closedHistory,
      timestamp: Date.now(),
    })
  }
}

/**
 * 创建标签管理器
 */
export function createTabManager(config?: TabManagerConfig): TabManager {
  return new TabManager(config)
}







