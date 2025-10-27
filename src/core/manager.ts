/**
 * 标签页管理器核心类
 * 
 * 这是整个标签页系统的核心管理器，负责标签的增删改查、状态管理、事件分发等核心功能。
 * 支持标签固定、拖拽排序、历史记录、持久化存储等高级特性。
 * 
 * @example
 * ```typescript
 * // 创建管理器实例
 * const manager = new TabManager({
 *   maxTabs: 10,
 *   persist: true,
 *   persistKey: 'my-app-tabs'
 * })
 * 
 * // 添加标签
 * const tab = manager.addTab({
 *   title: '首页',
 *   path: '/',
 *   icon: '🏠'
 * })
 * 
 * // 监听事件
 * manager.events.on('tab:add', (event) => {
 *   console.log('新标签已添加:', event.tab)
 * })
 * ```
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
 * 提供标签页管理器的默认行为配置
 */
const DEFAULT_CONFIG: Required<TabManagerConfig> = {
  maxTabs: 10,                      // 最大标签数量限制
  persist: true,                    // 启用持久化存储
  persistKey: 'ldesign_tabs',       // 存储键名
  defaultTabs: [],                  // 默认标签列表（应用启动时自动打开）
  autoActivate: true,               // 添加新标签时自动激活
}

/**
 * 标签页管理器类
 * 
 * 管理标签页的完整生命周期，包括：
 * - 标签的创建、更新、删除
 * - 标签的激活和切换
 * - 标签的固定和排序
 * - 标签状态的持久化
 * - 标签历史记录管理
 * - 事件系统集成
 */
export class TabManager {
  /** 标签列表（有序） */
  private tabs: Tab[] = []

  /** 当前激活的标签ID */
  private activeTabId: string | null = null

  /** 管理器配置 */
  private config: Required<TabManagerConfig>

  /** 存储适配器 */
  private storage: TabStorage

  /** 事件发射器 */
  private eventEmitter: TabEventEmitter

  /** 已关闭标签的历史记录（最多20条） */
  private closedHistory: ClosedTabHistory[] = []

  /**
   * 构造函数
   * 
   * @param config - 管理器配置选项
   * 
   * @example
   * ```typescript
   * const manager = new TabManager({
   *   maxTabs: 15,
   *   persist: true,
   *   defaultTabs: [{ title: '首页', path: '/' }]
   * })
   * ```
   */
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
   * 
   * 通过事件发射器可以监听标签页的各种变更事件，如添加、删除、激活等。
   * 
   * @returns 事件发射器实例
   * 
   * @example
   * ```typescript
   * manager.events.on('tab:add', (event) => {
   *   console.log('新标签:', event.tab)
   * })
   * ```
   */
  get events(): TabEventEmitter {
    return this.eventEmitter
  }

  /**
   * 添加标签
   * 
   * 创建并添加一个新标签到标签列表中。此方法会：
   * 1. 验证标签配置的有效性
   * 2. 检查是否超出最大数量限制
   * 3. 检查是否已存在相同路径的标签（存在则激活）
   * 4. 创建新标签并添加到合适的位置（固定标签在前）
   * 5. 触发 'tab:add' 事件
   * 6. 如果配置了自动激活，则激活新标签
   * 7. 持久化存储标签状态
   * 
   * @param config - 标签配置对象
   * @returns 成功返回新创建的标签对象，失败返回 null
   * 
   * @example
   * ```typescript
   * const tab = manager.addTab({
   *   title: '用户列表',
   *   path: '/users',
   *   icon: '👥',
   *   pinned: false
   * })
   * 
   * if (tab) {
   *   console.log('标签添加成功:', tab.id)
   * }
   * ```
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
   * 
   * 从标签列表中移除指定的标签。此方法会：
   * 1. 验证标签ID的有效性
   * 2. 检查标签是否可以关闭（不可关闭或当前激活的标签无法关闭）
   * 3. 将标签添加到历史记录中
   * 4. 从列表中移除标签
   * 5. 触发 'tab:remove' 事件
   * 6. 如果移除的是激活标签，自动激活相邻的标签
   * 7. 持久化存储更新后的状态
   * 
   * @param id - 要移除的标签ID
   * @returns 成功返回 true，失败返回 false
   * 
   * @example
   * ```typescript
   * const success = manager.removeTab('tab_123')
   * if (success) {
   *   console.log('标签已关闭')
   * }
   * ```
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
   * 
   * 更新指定标签的属性。可以更新标签的任何字段，除了ID字段。
   * 如果更新了 pinned 状态，会自动重新排序标签列表。
   * 
   * @param id - 要更新的标签ID
   * @param updates - 要更新的字段（部分更新）
   * @returns 成功返回 true，失败返回 false
   * 
   * @example
   * ```typescript
   * // 更新标签标题
   * manager.updateTab('tab_123', { title: '新标题' })
   * 
   * // 更新标签状态为加载中
   * manager.updateTab('tab_123', { status: 'loading' })
   * 
   * // 固定标签
   * manager.updateTab('tab_123', { pinned: true })
   * ```
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
   * 
   * 将指定标签设置为当前激活状态。激活标签会：
   * 1. 更新 activeTabId
   * 2. 更新标签的访问时间和访问次数
   * 3. 触发 'tab:activate' 事件（包含之前激活的标签信息）
   * 4. 持久化存储状态
   * 
   * @param id - 要激活的标签ID
   * @returns 成功返回 true，失败返回 false
   * 
   * @example
   * ```typescript
   * manager.activateTab('tab_123')
   * 
   * // 监听激活事件
   * manager.events.on('tab:activate', (event) => {
   *   console.log('当前标签:', event.tab)
   *   console.log('之前标签:', event.previousTab)
   * })
   * ```
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
   * 
   * 将标签设置为固定状态。固定的标签会：
   * 1. 移动到标签列表的最前面（固定标签区域）
   * 2. 不能被随意关闭
   * 3. 与普通标签之间有明显的分隔
   * 
   * @param id - 要固定的标签ID
   * @returns 成功返回 true，失败返回 false（如果标签已固定也返回 false）
   * 
   * @example
   * ```typescript
   * // 固定首页标签
   * manager.pinTab('home_tab')
   * ```
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
   * 
   * 将标签从固定状态恢复为普通状态。标签会移动到普通标签区域的开始位置。
   * 
   * @param id - 要取消固定的标签ID
   * @returns 成功返回 true，失败返回 false（如果标签未固定也返回 false）
   * 
   * @example
   * ```typescript
   * manager.unpinTab('home_tab')
   * ```
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
   * 
   * 通过拖拽或程序方式重新排列标签的顺序。该方法会：
   * 1. 验证索引的有效性
   * 2. 确保固定标签不能移到非固定区域（反之亦然）
   * 3. 执行数组元素移动
   * 4. 触发 'tab:reorder' 事件
   * 5. 持久化存储
   * 
   * @param fromIndex - 源位置索引（从0开始）
   * @param toIndex - 目标位置索引（从0开始）
   * @returns 成功返回 true，失败返回 false
   * 
   * @example
   * ```typescript
   * // 将第2个标签移动到第5个位置
   * manager.reorderTabs(1, 4)
   * ```
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
   * 
   * 关闭除指定标签外的所有可关闭标签。固定标签和不可关闭标签会被保留。
   * 所有被关闭的标签会添加到历史记录中。
   * 
   * @param id - 要保留的标签ID
   * @returns 返回被关闭的标签数量
   * 
   * @example
   * ```typescript
   * const closedCount = manager.closeOtherTabs('current_tab')
   * console.log(`关闭了 ${closedCount} 个标签`)
   * ```
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
   * 
   * 关闭所有可关闭的标签。固定标签和不可关闭标签会被保留。
   * 如果当前激活的标签被关闭，会自动激活第一个剩余标签。
   * 
   * @returns 返回被关闭的标签数量
   * 
   * @example
   * ```typescript
   * const closedCount = manager.closeAllTabs()
   * if (closedCount > 0) {
   *   console.log(`已关闭 ${closedCount} 个标签`)
   * }
   * ```
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
   * 
   * 关闭指定标签右侧的所有可关闭标签。固定标签和不可关闭标签会被保留。
   * 
   * @param id - 基准标签ID（该标签右侧的标签会被关闭）
   * @returns 返回被关闭的标签数量
   * 
   * @example
   * ```typescript
   * const closedCount = manager.closeTabsToRight('tab_123')
   * console.log(`关闭了右侧 ${closedCount} 个标签`)
   * ```
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
   * 
   * 关闭指定标签左侧的所有可关闭标签。固定标签和不可关闭标签会被保留。
   * 
   * @param id - 基准标签ID（该标签左侧的标签会被关闭）
   * @returns 返回被关闭的标签数量
   * 
   * @example
   * ```typescript
   * const closedCount = manager.closeTabsToLeft('tab_123')
   * console.log(`关闭了左侧 ${closedCount} 个标签`)
   * ```
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
   * 
   * 根据ID获取单个标签的完整信息。返回的是标签的深拷贝副本，修改不会影响原标签。
   * 
   * @param id - 标签ID
   * @returns 找到返回标签对象，未找到返回 undefined
   * 
   * @example
   * ```typescript
   * const tab = manager.getTab('tab_123')
   * if (tab) {
   *   console.log('标签标题:', tab.title)
   *   console.log('访问次数:', tab.visitCount)
   * }
   * ```
   */
  getTab(id: string): Tab | undefined {
    const tab = this.tabs.find(t => t.id === id)
    return tab ? deepClone(tab) : undefined
  }

  /**
   * 获取所有标签
   * 
   * 获取当前所有标签的列表。返回的是标签的深拷贝数组。
   * 标签顺序与显示顺序一致（固定标签在前，普通标签在后）。
   * 
   * @returns 标签数组
   * 
   * @example
   * ```typescript
   * const allTabs = manager.getAllTabs()
   * console.log(`共有 ${allTabs.length} 个标签`)
   * 
   * // 遍历所有标签
   * allTabs.forEach(tab => {
   *   console.log(`${tab.title} - ${tab.path}`)
   * })
   * ```
   */
  getAllTabs(): Tab[] {
    return this.tabs.map(tab => deepClone(tab))
  }

  /**
   * 获取激活的标签
   * 
   * 获取当前激活（显示）的标签对象。如果没有激活的标签，返回 undefined。
   * 
   * @returns 激活的标签对象，无激活标签返回 undefined
   * 
   * @example
   * ```typescript
   * const activeTab = manager.getActiveTab()
   * if (activeTab) {
   *   console.log('当前标签:', activeTab.title)
   * } else {
   *   console.log('没有激活的标签')
   * }
   * ```
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
   * 
   * 根据路径检查是否已存在相同的标签。用于防止打开重复的页面。
   * 
   * @param path - 要检查的路径
   * @returns 存在返回 true，不存在返回 false
   * 
   * @example
   * ```typescript
   * if (!manager.hasDuplicateTab('/users')) {
   *   manager.addTab({ title: '用户列表', path: '/users' })
   * } else {
   *   console.log('该标签已存在')
   * }
   * ```
   */
  hasDuplicateTab(path: string): boolean {
    return Boolean(findTabByPath(this.tabs, path))
  }

  /**
   * 检查是否可以添加标签
   * 
   * 检查当前标签数量是否已达到最大限制。
   * 
   * @returns 可以添加返回 true，已达上限返回 false
   * 
   * @example
   * ```typescript
   * if (manager.canAddTab()) {
   *   manager.addTab({ title: '新标签', path: '/new' })
   * } else {
   *   console.log('标签数量已达上限')
   * }
   * ```
   */
  canAddTab(): boolean {
    return canAddTab(this.tabs.length, this.config.maxTabs)
  }

  /**
   * 获取标签数量
   * 
   * 获取当前标签的总数量（包括固定标签和普通标签）。
   * 
   * @returns 标签总数
   * 
   * @example
   * ```typescript
   * console.log(`当前有 ${manager.getTabsCount()} 个标签`)
   * ```
   */
  getTabsCount(): number {
    return this.tabs.length
  }

  /**
   * 获取关闭历史
   * 
   * 获取最近关闭的标签历史记录（最多20条）。
   * 返回的是历史记录的副本，修改不会影响原始数据。
   * 
   * @returns 关闭历史数组，按关闭时间倒序排列
   * 
   * @example
   * ```typescript
   * const history = manager.getClosedHistory()
   * history.forEach(item => {
   *   console.log(`${item.tab.title} - ${new Date(item.closedAt).toLocaleString()}`)
   * })
   * ```
   */
  getClosedHistory(): ClosedTabHistory[] {
    return [...this.closedHistory]
  }

  /**
   * 恢复最近关闭的标签
   * 
   * 重新打开最近一次关闭的标签。标签会从历史记录中移除。
   * 如果历史记录为空，返回 null。
   * 
   * @returns 成功返回重新打开的标签对象，失败返回 null
   * 
   * @example
   * ```typescript
   * const reopenedTab = manager.reopenLastClosedTab()
   * if (reopenedTab) {
   *   console.log('已恢复标签:', reopenedTab.title)
   * } else {
   *   console.log('没有可恢复的标签')
   * }
   * ```
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
   * 
   * 清空所有关闭标签的历史记录。清除后无法再恢复之前关闭的标签。
   * 
   * @example
   * ```typescript
   * manager.clearHistory()
   * console.log('历史记录已清空')
   * ```
   */
  clearHistory(): void {
    this.closedHistory = []
    this.saveHistoryToStorage()
  }

  /**
   * 销毁管理器
   * 
   * 清理管理器的所有资源，包括：
   * - 清除所有事件监听器
   * - 清空标签列表
   * - 清空历史记录
   * - 重置激活状态
   * 
   * 注意：销毁后的管理器不应再使用。
   * 
   * @example
   * ```typescript
   * // 在组件卸载时销毁管理器
   * onUnmounted(() => {
   *   manager.destroy()
   * })
   * ```
   */
  destroy(): void {
    this.eventEmitter.clear()
    this.tabs = []
    this.activeTabId = null
    this.closedHistory = []
  }

  /**
   * 按固定状态排序
   * 
   * 内部方法：重新排列标签列表，确保固定标签始终在前面。
   * 这个方法在标签的固定状态发生变化时自动调用。
   */
  private sortTabsByPinned(): void {
    const pinned = filterPinnedTabs(this.tabs)
    const unpinned = filterUnpinnedTabs(this.tabs)
    this.tabs = [...pinned, ...unpinned]
  }

  /**
   * 添加到历史记录
   * 
   * 内部方法：将关闭的标签添加到历史记录中。
   * 历史记录最多保存20条，超过时会自动删除最早的记录。
   * 
   * @param tab - 被关闭的标签对象
   * @param index - 标签在列表中的位置索引
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
   * 
   * 内部方法：将当前标签状态持久化到 localStorage。
   * 只有在配置了 persist: true 时才会执行保存操作。
   * 保存的数据包括：标签列表、激活标签ID、时间戳、版本号。
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
   * 
   * 内部方法：从 localStorage 恢复标签状态。
   * 在管理器初始化时自动调用。成功恢复后会触发 'tabs:restored' 事件。
   * 包括恢复标签列表、激活状态和历史记录。
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
   * 
   * 内部方法：将关闭历史记录持久化到 localStorage。
   * 只有在配置了 persist: true 时才会执行保存操作。
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
 * 
 * 工厂函数：创建并返回一个标签管理器实例。
 * 这是推荐的创建管理器的方式。
 * 
 * @param config - 可选的管理器配置
 * @returns 标签管理器实例
 * 
 * @example
 * ```typescript
 * // 使用默认配置创建
 * const manager = createTabManager()
 * 
 * // 使用自定义配置创建
 * const manager = createTabManager({
 *   maxTabs: 15,
 *   persist: true,
 *   persistKey: 'my-app-tabs',
 *   defaultTabs: [
 *     { title: '首页', path: '/' }
 *   ]
 * })
 * ```
 */
export function createTabManager(config?: TabManagerConfig): TabManager {
  return new TabManager(config)
}











