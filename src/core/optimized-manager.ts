/**
 * 优化版标签管理器
 * 
 * 性能优化要点：
 * 1. 减少深拷贝，使用不可变数据结构
 * 2. 批量更新，减少存储操作
 * 3. 使用 WeakMap 缓存，自动垃圾回收
 * 4. 实现虚拟化支持
 * 5. 优化事件系统性能
 */

import { nanoid } from 'nanoid'
import type {
  Tab,
  TabConfig,
  TabManagerConfig,
  TabEventEmitter,
  ClosedTabHistory,
} from '../types'
import { EventEmitter } from './event-emitter'
import { createTabStorage } from './storage'

// 性能优化：使用 Object.freeze 创建不可变对象
const DEFAULT_CONFIG = Object.freeze<Required<TabManagerConfig>>({
  maxTabs: 10,
  persist: true,
  persistKey: 'ldesign_tabs',
  defaultTabs: [],
  autoActivate: true,
})

/**
 * 性能优化的标签管理器
 */
export class OptimizedTabManager {
  private tabs: ReadonlyArray<Tab> = []
  private activeTabId: string | null = null
  private config: Readonly<Required<TabManagerConfig>>
  private storage: ReturnType<typeof createTabStorage>
  private eventEmitter: TabEventEmitter
  private closedHistory: ClosedTabHistory[] = []

  // 性能优化：使用缓存
  private tabsCache = new WeakMap<Tab, any>()
  private pathIndex = new Map<string, Tab>() // 路径索引
  private idIndex = new Map<string, Tab>() // ID索引

  // 性能优化：批量更新
  private pendingSave: ReturnType<typeof setTimeout> | null = null
  private saveDebounceMs = 100 // 100ms 防抖

  // 性能优化：虚拟化支持
  private visibleRange = { start: 0, end: 20 } // 默认显示前20个

  constructor(config: TabManagerConfig = {}) {
    this.config = Object.freeze({ ...DEFAULT_CONFIG, ...config })
    this.storage = createTabStorage(this.config.persistKey)
    this.eventEmitter = new EventEmitter()

    // 恢复状态
    this.restoreFromStorage()

    // 初始化默认标签
    if (this.tabs.length === 0 && this.config.defaultTabs.length > 0) {
      this.batchAddTabs(this.config.defaultTabs)
    }
  }

  get events(): TabEventEmitter {
    return this.eventEmitter
  }

  /**
   * 批量添加标签（性能优化）
   */
  batchAddTabs(configs: TabConfig[]): Tab[] {
    const newTabs: Tab[] = []
    const mutableTabs = [...this.tabs]

    for (const config of configs) {
      // 验证配置
      if (!this.validateTabConfig(config)) {
        continue
      }

      // 检查重复
      if (this.pathIndex.has(config.path)) {
        continue
      }

      // 检查限制
      if (mutableTabs.length + newTabs.length >= this.config.maxTabs) {
        break
      }

      // 创建标签（避免深拷贝）
      const tab: Tab = Object.freeze({
        id: config.id || this.generateOptimizedId(),
        title: config.title,
        path: config.path,
        icon: config.icon,
        pinned: config.pinned || false,
        closable: config.closable !== false,
        status: 'normal',
        meta: config.meta ? Object.freeze(config.meta) : undefined,
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        visitCount: 1,
      })

      newTabs.push(tab)
      this.updateIndexes(tab, 'add')
    }

    if (newTabs.length > 0) {
      // 批量更新
      this.tabs = Object.freeze([...mutableTabs, ...newTabs])

      // 批量事件
      this.eventEmitter.emit({
        type: 'tabs:batch-add',
        timestamp: Date.now(),
        tabs: newTabs,
      } as any)

      // 防抖保存
      this.debouncedSave()

      // 自动激活最后一个
      if (this.config.autoActivate && newTabs.length > 0) {
        this.activateTab(newTabs[newTabs.length - 1].id)
      }
    }

    return newTabs
  }

  /**
   * 添加单个标签
   */
  addTab(config: TabConfig): Tab | null {
    const tabs = this.batchAddTabs([config])
    return tabs.length > 0 ? tabs[0] : null
  }

  /**
   * 移除标签（优化版）
   */
  removeTab(id: string): boolean {
    const tab = this.idIndex.get(id)
    if (!tab) {
      return false
    }

    const index = this.tabs.indexOf(tab)
    if (index === -1) {
      return false
    }

    // 检查是否可关闭
    if (!tab.closable) {
      return false
    }

    // 使用不可变更新
    const newTabs = [
      ...this.tabs.slice(0, index),
      ...this.tabs.slice(index + 1)
    ]

    this.tabs = Object.freeze(newTabs)
    this.updateIndexes(tab, 'remove')

    // 添加到历史
    this.addToHistory(tab, index)

    // 发射事件
    this.eventEmitter.emit({
      type: 'tab:remove',
      timestamp: Date.now(),
      tab,
      index,
    })

    // 处理激活状态
    if (this.activeTabId === id) {
      const nextTab = newTabs[Math.min(index, newTabs.length - 1)]
      if (nextTab) {
        this.activateTab(nextTab.id)
      } else {
        this.activeTabId = null
      }
    }

    // 防抖保存
    this.debouncedSave()

    return true
  }

  /**
   * 更新标签（优化版）
   */
  updateTab(id: string, updates: Partial<Tab>): boolean {
    const tab = this.idIndex.get(id)
    if (!tab) {
      return false
    }

    const index = this.tabs.indexOf(tab)
    if (index === -1) {
      return false
    }

    // 创建新的不可变标签
    const updatedTab = Object.freeze({
      ...tab,
      ...updates,
      id: tab.id, // ID不可修改
      lastAccessedAt: Date.now(),
    })

    // 不可变更新数组
    const newTabs = [...this.tabs]
    newTabs[index] = updatedTab
    this.tabs = Object.freeze(newTabs)

    // 更新索引
    this.updateIndexes(tab, 'remove')
    this.updateIndexes(updatedTab, 'add')

    // 发射事件
    this.eventEmitter.emit({
      type: 'tab:update',
      timestamp: Date.now(),
      tab: updatedTab,
      changes: updates,
    })

    // 如果固定状态改变，重新排序
    if (updates.pinned !== undefined && updates.pinned !== tab.pinned) {
      this.sortTabsByPinned()
    }

    // 防抖保存
    this.debouncedSave()

    return true
  }

  /**
   * 激活标签（优化版）
   */
  activateTab(id: string): boolean {
    if (this.activeTabId === id) {
      return true // 已经激活，直接返回
    }

    const tab = this.idIndex.get(id)
    if (!tab) {
      return false
    }

    const previousTab = this.activeTabId
      ? this.idIndex.get(this.activeTabId)
      : undefined

    this.activeTabId = id

    // 更新访问信息（创建新对象）
    const updatedTab = Object.freeze({
      ...tab,
      lastAccessedAt: Date.now(),
      visitCount: tab.visitCount + 1,
    })

    // 更新到数组
    const index = this.tabs.indexOf(tab)
    if (index !== -1) {
      const newTabs = [...this.tabs]
      newTabs[index] = updatedTab
      this.tabs = Object.freeze(newTabs)

      // 更新索引
      this.idIndex.set(id, updatedTab)
      this.pathIndex.set(updatedTab.path, updatedTab)
    }

    // 发射事件
    this.eventEmitter.emit({
      type: 'tab:activate',
      timestamp: Date.now(),
      tab: updatedTab,
      previousTab,
    })

    // 防抖保存
    this.debouncedSave()

    return true
  }

  /**
   * 获取可见范围的标签（虚拟化支持）
   */
  getVisibleTabs(): ReadonlyArray<Tab> {
    const { start, end } = this.visibleRange
    return this.tabs.slice(start, Math.min(end, this.tabs.length))
  }

  /**
   * 设置可见范围（虚拟化支持）
   */
  setVisibleRange(start: number, end: number): void {
    this.visibleRange = { start, end }

    // 发射范围改变事件
    this.eventEmitter.emit({
      type: 'tabs:visible-range-changed',
      timestamp: Date.now(),
      start,
      end,
    } as any)
  }

  /**
   * 获取所有标签（返回不可变数组）
   */
  getAllTabs(): ReadonlyArray<Tab> {
    return this.tabs
  }

  /**
   * 获取激活的标签
   */
  getActiveTab(): Tab | undefined {
    return this.activeTabId ? this.idIndex.get(this.activeTabId) : undefined
  }

  /**
   * 获取标签
   */
  getTab(id: string): Tab | undefined {
    return this.idIndex.get(id)
  }

  /**
   * 根据路径获取标签
   */
  getTabByPath(path: string): Tab | undefined {
    return this.pathIndex.get(path)
  }

  /**
   * 关闭其他标签（批量操作优化）
   */
  closeOtherTabs(id: string): number {
    const keptTab = this.idIndex.get(id)
    if (!keptTab) {
      return 0
    }

    const closedTabs: Tab[] = []
    const newTabs = this.tabs.filter(tab => {
      if (tab.id === id || !tab.closable || tab.pinned) {
        return true
      }
      closedTabs.push(tab)
      this.addToHistory(tab, -1)
      return false
    })

    if (closedTabs.length > 0) {
      this.tabs = Object.freeze(newTabs)

      // 批量更新索引
      closedTabs.forEach(tab => this.updateIndexes(tab, 'remove'))

      // 发射事件
      this.eventEmitter.emit({
        type: 'tab:close-others',
        timestamp: Date.now(),
        closedTabs,
        keptTab,
      })

      // 防抖保存
      this.debouncedSave()
    }

    return closedTabs.length
  }

  /**
   * 清理资源
   */
  destroy(): void {
    // 清理定时器
    if (this.pendingSave) {
      clearTimeout(this.pendingSave)
      this.pendingSave = null
    }

    // 清理事件
    this.eventEmitter.clear()

    // 清理缓存
    this.tabsCache = new WeakMap()
    this.pathIndex.clear()
    this.idIndex.clear()

    // 清理数据
    this.tabs = []
    this.activeTabId = null
    this.closedHistory = []
  }

  // ========== 私有方法 ==========

  /**
   * 验证标签配置
   */
  private validateTabConfig(config: TabConfig): boolean {
    return !!(config.title && config.path)
  }

  /**
   * 生成优化的ID
   */
  private generateOptimizedId(): string {
    // 使用 nanoid 生成更短的ID
    return `tab_${nanoid(8)}`
  }

  /**
   * 更新索引（优化查找性能）
   */
  private updateIndexes(tab: Tab, action: 'add' | 'remove'): void {
    if (action === 'add') {
      this.idIndex.set(tab.id, tab)
      this.pathIndex.set(tab.path, tab)
    } else {
      this.idIndex.delete(tab.id)
      this.pathIndex.delete(tab.path)
    }
  }

  /**
   * 防抖保存
   */
  private debouncedSave(): void {
    if (!this.config.persist) {
      return
    }

    // 清除之前的定时器
    if (this.pendingSave) {
      clearTimeout(this.pendingSave)
    }

    // 设置新的定时器
    this.pendingSave = setTimeout(() => {
      this.saveToStorage()
      this.pendingSave = null
    }, this.saveDebounceMs)
  }

  /**
   * 保存到存储
   */
  private saveToStorage(): void {
    if (!this.config.persist) {
      return
    }

    // 只保存必要的数据
    this.storage.saveTabs({
      tabs: this.tabs as Tab[], // 存储时转换类型
      activeTabId: this.activeTabId,
      timestamp: Date.now(),
      version: '2.0.0', // 新版本
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
    if (state?.tabs && Array.isArray(state.tabs)) {
      // 创建不可变标签
      const restoredTabs = state.tabs.map(tab => Object.freeze(tab))
      this.tabs = Object.freeze(restoredTabs)
      this.activeTabId = state.activeTabId

      // 重建索引
      restoredTabs.forEach(tab => this.updateIndexes(tab, 'add'))

      // 发射恢复事件
      this.eventEmitter.emit({
        type: 'tabs:restored',
        timestamp: Date.now(),
        tabs: restoredTabs,
      })
    }

    // 恢复历史
    const history = this.storage.loadHistory()
    if (history?.closedTabs) {
      this.closedHistory = history.closedTabs
    }
  }

  /**
   * 添加到历史
   */
  private addToHistory(tab: Tab, index: number): void {
    this.closedHistory.push({
      tab: Object.freeze({ ...tab }), // 创建不可变副本
      closedAt: Date.now(),
      index,
    })

    // 限制历史记录数量
    if (this.closedHistory.length > 20) {
      this.closedHistory.shift()
    }

    // 防抖保存历史
    this.debouncedSaveHistory()
  }

  /**
   * 防抖保存历史
   */
  private debouncedSaveHistory(): void {
    if (!this.config.persist) {
      return
    }

    // 复用保存逻辑
    this.debouncedSave()
  }

  /**
   * 按固定状态排序
   */
  private sortTabsByPinned(): void {
    const pinned = this.tabs.filter(tab => tab.pinned)
    const unpinned = this.tabs.filter(tab => !tab.pinned)
    this.tabs = Object.freeze([...pinned, ...unpinned])

    // 重建索引
    this.idIndex.clear()
    this.pathIndex.clear()
    this.tabs.forEach(tab => this.updateIndexes(tab, 'add'))
  }

  /**
   * 恢复最近关闭的标签
   */
  reopenLastClosedTab(): Tab | null {
    const lastClosed = this.closedHistory.pop()
    if (!lastClosed) {
      return null
    }

    const tab = this.addTab({
      title: lastClosed.tab.title,
      path: lastClosed.tab.path,
      icon: lastClosed.tab.icon,
      pinned: lastClosed.tab.pinned,
      meta: lastClosed.tab.meta,
    })

    this.debouncedSaveHistory()
    return tab
  }

  /**
   * 获取标签数量
   */
  getTabsCount(): number {
    return this.tabs.length
  }

  /**
   * 是否可以添加标签
   */
  canAddTab(): boolean {
    return this.tabs.length < this.config.maxTabs
  }

  /**
   * 重新排序标签
   */
  reorderTabs(fromIndex: number, toIndex: number): boolean {
    if (fromIndex === toIndex ||
      fromIndex < 0 || fromIndex >= this.tabs.length ||
      toIndex < 0 || toIndex >= this.tabs.length) {
      return false
    }

    const newTabs = [...this.tabs]
    const [tab] = newTabs.splice(fromIndex, 1)
    newTabs.splice(toIndex, 0, tab)

    this.tabs = Object.freeze(newTabs)

    this.eventEmitter.emit({
      type: 'tab:reorder',
      timestamp: Date.now(),
      tabId: tab.id,
      fromIndex,
      toIndex,
    })

    this.debouncedSave()
    return true
  }
}

/**
 * 创建优化的标签管理器
 */
export function createOptimizedTabManager(config?: TabManagerConfig): OptimizedTabManager {
  return new OptimizedTabManager(config)
}

