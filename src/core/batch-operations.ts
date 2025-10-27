/**
 * 批量操作管理器
 * 
 * 提供标签页的批量操作功能，支持多选、批量关闭、批量移动等。
 * 提高处理大量标签时的效率。
 * 
 * 主要功能：
 * - 标签多选（单选/全选/反选）
 * - 批量关闭标签
 * - 批量移动到分组
 * - 批量保存为模板
 * - 批量操作状态管理
 * 
 * @example
 * ```typescript
 * const batchOps = new BatchOperationsManager(tabManager)
 * 
 * // 选择多个标签
 * batchOps.toggleSelection('tab1')
 * batchOps.toggleSelection('tab2')
 * 
 * // 批量关闭
 * batchOps.closeSelected()
 * ```
 */

import type { Tab, TabEventEmitter } from '../types'
import type { TabManager } from './manager'
import { deepClone } from '../utils'

/**
 * 批量操作管理器类
 */
export class BatchOperationsManager {
  /** 标签管理器引用 */
  private tabManager: TabManager

  /** 选中的标签ID集合 */
  private selectedTabIds: Set<string> = new Set()

  /** 是否启用批量选择模式 */
  private batchMode: boolean = false

  /** 事件发射器 */
  private get events(): TabEventEmitter {
    return this.tabManager.events
  }

  /**
   * 构造函数
   * 
   * @param tabManager - 标签管理器实例
   * 
   * @example
   * ```typescript
   * const batchOps = new BatchOperationsManager(tabManager)
   * ```
   */
  constructor(tabManager: TabManager) {
    this.tabManager = tabManager
  }

  /**
   * 是否处于批量模式
   * 
   * @returns 批量模式状态
   */
  get isBatchMode(): boolean {
    return this.batchMode
  }

  /**
   * 启用批量模式
   * 
   * 进入批量选择模式，用户可以选择多个标签进行批量操作。
   * 
   * @example
   * ```typescript
   * batchOps.enableBatchMode()
   * // 现在可以选择多个标签
   * ```
   */
  enableBatchMode(): void {
    this.batchMode = true
    this.selectedTabIds.clear()

    this.events.emit({
      type: 'batch:mode-enabled',
      timestamp: Date.now(),
    } as any)
  }

  /**
   * 退出批量模式
   * 
   * 退出批量选择模式，清除所有选中状态。
   * 
   * @example
   * ```typescript
   * batchOps.disableBatchMode()
   * // 批量模式已关闭，选择已清除
   * ```
   */
  disableBatchMode(): void {
    this.batchMode = false
    this.selectedTabIds.clear()

    this.events.emit({
      type: 'batch:mode-disabled',
      timestamp: Date.now(),
    } as any)
  }

  /**
   * 切换批量模式
   * 
   * 在启用和禁用批量模式之间切换。
   * 
   * @returns 当前批量模式状态
   */
  toggleBatchMode(): boolean {
    if (this.batchMode) {
      this.disableBatchMode()
    } else {
      this.enableBatchMode()
    }
    return this.batchMode
  }

  /**
   * 切换标签选中状态
   * 
   * 如果标签已选中则取消选中，如果未选中则选中。
   * 
   * @param tabId - 标签ID
   * @returns 选中后的状态（true为选中，false为未选中）
   * 
   * @example
   * ```typescript
   * // 选中标签
   * batchOps.toggleSelection('tab1')  // true
   * 
   * // 再次切换，取消选中
   * batchOps.toggleSelection('tab1')  // false
   * ```
   */
  toggleSelection(tabId: string): boolean {
    if (this.selectedTabIds.has(tabId)) {
      this.selectedTabIds.delete(tabId)
      return false
    } else {
      this.selectedTabIds.add(tabId)
      return true
    }
  }

  /**
   * 选中标签
   * 
   * 将指定的标签添加到选中列表。
   * 
   * @param tabId - 标签ID
   * 
   * @example
   * ```typescript
   * batchOps.selectTab('tab1')
   * batchOps.selectTab('tab2')
   * ```
   */
  selectTab(tabId: string): void {
    this.selectedTabIds.add(tabId)
  }

  /**
   * 取消选中标签
   * 
   * 将指定的标签从选中列表移除。
   * 
   * @param tabId - 标签ID
   * 
   * @example
   * ```typescript
   * batchOps.deselectTab('tab1')
   * ```
   */
  deselectTab(tabId: string): void {
    this.selectedTabIds.delete(tabId)
  }

  /**
   * 检查标签是否已选中
   * 
   * @param tabId - 标签ID
   * @returns 如果已选中返回true
   * 
   * @example
   * ```typescript
   * if (batchOps.isSelected('tab1')) {
   *   console.log('标签已选中')
   * }
   * ```
   */
  isSelected(tabId: string): boolean {
    return this.selectedTabIds.has(tabId)
  }

  /**
   * 全选标签
   * 
   * 选中所有当前打开的标签。
   * 
   * @param options - 选项
   * @param options.includePinned - 是否包含固定标签（默认true）
   * @returns 选中的标签数量
   * 
   * @example
   * ```typescript
   * // 全选所有标签
   * const count = batchOps.selectAll()
   * console.log(`已选中 ${count} 个标签`)
   * 
   * // 只选中非固定标签
   * const count2 = batchOps.selectAll({ includePinned: false })
   * ```
   */
  selectAll(options: { includePinned?: boolean } = {}): number {
    const { includePinned = true } = options
    const tabs = this.tabManager.getAllTabs()

    this.selectedTabIds.clear()

    tabs.forEach((tab) => {
      if (includePinned || !tab.pinned) {
        this.selectedTabIds.add(tab.id)
      }
    })

    return this.selectedTabIds.size
  }

  /**
   * 反选标签
   * 
   * 将选中的标签取消选中，将未选中的标签选中。
   * 
   * @param options - 选项
   * @param options.includePinned - 是否包含固定标签（默认true）
   * @returns 选中的标签数量
   * 
   * @example
   * ```typescript
   * // 反选所有标签
   * const count = batchOps.invertSelection()
   * console.log(`现在选中 ${count} 个标签`)
   * ```
   */
  invertSelection(options: { includePinned?: boolean } = {}): number {
    const { includePinned = true } = options
    const tabs = this.tabManager.getAllTabs()
    const newSelection = new Set<string>()

    tabs.forEach((tab) => {
      if ((includePinned || !tab.pinned) && !this.selectedTabIds.has(tab.id)) {
        newSelection.add(tab.id)
      }
    })

    this.selectedTabIds = newSelection
    return this.selectedTabIds.size
  }

  /**
   * 清除选择
   * 
   * 取消选中所有标签。
   * 
   * @example
   * ```typescript
   * batchOps.clearSelection()
   * ```
   */
  clearSelection(): void {
    this.selectedTabIds.clear()
  }

  /**
   * 获取选中的标签ID列表
   * 
   * @returns 标签ID数组
   * 
   * @example
   * ```typescript
   * const selectedIds = batchOps.getSelectedIds()
   * console.log(`选中了 ${selectedIds.length} 个标签`)
   * ```
   */
  getSelectedIds(): string[] {
    return Array.from(this.selectedTabIds)
  }

  /**
   * 获取选中的标签对象列表
   * 
   * @returns 标签对象数组
   * 
   * @example
   * ```typescript
   * const selectedTabs = batchOps.getSelectedTabs()
   * selectedTabs.forEach(tab => {
   *   console.log(tab.title)
   * })
   * ```
   */
  getSelectedTabs(): Tab[] {
    const allTabs = this.tabManager.getAllTabs()
    return allTabs.filter(tab => this.selectedTabIds.has(tab.id))
  }

  /**
   * 获取选中标签的数量
   * 
   * @returns 选中的标签数量
   * 
   * @example
   * ```typescript
   * console.log(`已选中 ${batchOps.getSelectedCount()} 个标签`)
   * ```
   */
  getSelectedCount(): number {
    return this.selectedTabIds.size
  }

  /**
   * 批量关闭选中的标签
   * 
   * 关闭所有选中的可关闭标签。
   * 固定标签和不可关闭的标签会被跳过。
   * 
   * @returns 成功关闭的标签数量
   * 
   * @example
   * ```typescript
   * batchOps.selectTab('tab1')
   * batchOps.selectTab('tab2')
   * 
   * const closedCount = batchOps.closeSelected()
   * console.log(`关闭了 ${closedCount} 个标签`)
   * 
   * // 批量模式会自动退出
   * ```
   */
  closeSelected(): number {
    const selectedIds = this.getSelectedIds()
    let closedCount = 0

    selectedIds.forEach((tabId) => {
      if (this.tabManager.removeTab(tabId)) {
        closedCount++
      }
    })

    // 清除选择并退出批量模式
    this.disableBatchMode()

    this.events.emit({
      type: 'batch:close',
      timestamp: Date.now(),
      closedCount,
    } as any)

    return closedCount
  }

  /**
   * 批量固定选中的标签
   * 
   * 将所有选中的标签设置为固定状态。
   * 
   * @returns 成功固定的标签数量
   * 
   * @example
   * ```typescript
   * const pinnedCount = batchOps.pinSelected()
   * console.log(`固定了 ${pinnedCount} 个标签`)
   * ```
   */
  pinSelected(): number {
    const selectedTabs = this.getSelectedTabs()
    let pinnedCount = 0

    selectedTabs.forEach((tab) => {
      if (!tab.pinned) {
        // 使用 updateTab 而不是 pinTab，避免触发过多事件
        if (this.tabManager.updateTab(tab.id, { pinned: true })) {
          pinnedCount++
        }
      }
    })

    this.events.emit({
      type: 'batch:pin',
      timestamp: Date.now(),
      pinnedCount,
    } as any)

    return pinnedCount
  }

  /**
   * 批量取消固定选中的标签
   * 
   * 将所有选中的标签取消固定状态。
   * 
   * @returns 成功取消固定的标签数量
   * 
   * @example
   * ```typescript
   * const unpinnedCount = batchOps.unpinSelected()
   * console.log(`取消固定了 ${unpinnedCount} 个标签`)
   * ```
   */
  unpinSelected(): number {
    const selectedTabs = this.getSelectedTabs()
    let unpinnedCount = 0

    selectedTabs.forEach((tab) => {
      if (tab.pinned) {
        if (this.tabManager.updateTab(tab.id, { pinned: false })) {
          unpinnedCount++
        }
      }
    })

    this.events.emit({
      type: 'batch:unpin',
      timestamp: Date.now(),
      unpinnedCount,
    } as any)

    return unpinnedCount
  }

  /**
   * 批量添加选中的标签到分组
   * 
   * 将所有选中的标签添加到指定分组。
   * 需要配合 GroupManager 使用。
   * 
   * @param groupId - 分组ID
   * @returns 成功添加的标签数量
   * 
   * @example
   * ```typescript
   * // 假设已有 groupManager
   * const group = groupManager.createGroup({ name: '开发环境' })
   * 
   * // 选择标签并添加到分组
   * batchOps.selectTab('tab1')
   * batchOps.selectTab('tab2')
   * const addedCount = batchOps.addSelectedToGroup(group.id)
   * ```
   */
  addSelectedToGroup(groupId: string): number {
    const selectedIds = this.getSelectedIds()

    this.events.emit({
      type: 'batch:add-to-group',
      timestamp: Date.now(),
      groupId,
      tabIds: selectedIds,
    } as any)

    return selectedIds.length
  }

  /**
   * 将选中的标签保存为模板
   * 
   * 将当前选中的标签保存为一个新模板。
   * 需要配合 TemplateManager 使用。
   * 
   * @param name - 模板名称
   * @param description - 模板描述
   * @returns 选中的标签配置数组
   * 
   * @example
   * ```typescript
   * // 选择标签
   * batchOps.selectTab('tab1')
   * batchOps.selectTab('tab2')
   * 
   * // 保存为模板（需要手动调用 templateManager）
   * const tabConfigs = batchOps.saveSelectedAsTemplate('我的模板')
   * ```
   */
  saveSelectedAsTemplate(name: string, description?: string): Array<{
    title: string
    path: string
    icon?: string
    pinned: boolean
    meta?: Record<string, any>
  }> {
    const selectedTabs = this.getSelectedTabs()

    const tabConfigs = selectedTabs.map(tab => ({
      title: tab.title,
      path: tab.path,
      icon: tab.icon,
      pinned: tab.pinned,
      meta: tab.meta,
    }))

    this.events.emit({
      type: 'batch:save-as-template',
      timestamp: Date.now(),
      name,
      description,
      tabCount: tabConfigs.length,
    } as any)

    return tabConfigs
  }

  /**
   * 按范围选择标签
   * 
   * 选择从起始标签到结束标签之间的所有标签（包含两端）。
   * 常用于 Shift+点击 实现连续选择。
   * 
   * @param startTabId - 起始标签ID
   * @param endTabId - 结束标签ID
   * @returns 选中的标签数量
   * 
   * @example
   * ```typescript
   * // 实现 Shift+点击 连续选择
   * let lastClickedId = null
   * 
   * function handleTabClick(tabId, event) {
   *   if (event.shiftKey && lastClickedId) {
   *     batchOps.selectRange(lastClickedId, tabId)
   *   } else {
   *     batchOps.toggleSelection(tabId)
   *   }
   *   lastClickedId = tabId
   * }
   * ```
   */
  selectRange(startTabId: string, endTabId: string): number {
    const allTabs = this.tabManager.getAllTabs()
    const startIndex = allTabs.findIndex(tab => tab.id === startTabId)
    const endIndex = allTabs.findIndex(tab => tab.id === endTabId)

    if (startIndex === -1 || endIndex === -1) {
      return 0
    }

    const minIndex = Math.min(startIndex, endIndex)
    const maxIndex = Math.max(startIndex, endIndex)

    for (let i = minIndex; i <= maxIndex; i++) {
      this.selectedTabIds.add(allTabs[i].id)
    }

    return maxIndex - minIndex + 1
  }

  /**
   * 获取批量操作统计信息
   * 
   * @returns 统计信息对象
   * 
   * @example
   * ```typescript
   * const stats = batchOps.getStatistics()
   * console.log(`
   *   批量模式: ${stats.isBatchMode ? '开启' : '关闭'}
   *   已选中: ${stats.selectedCount} 个
   *   总标签: ${stats.totalTabs} 个
   *   可关闭: ${stats.closableCount} 个
   * `)
   * ```
   */
  getStatistics(): {
    isBatchMode: boolean
    selectedCount: number
    totalTabs: number
    closableCount: number
    pinnedCount: number
  } {
    const allTabs = this.tabManager.getAllTabs()
    const selectedTabs = this.getSelectedTabs()

    return {
      isBatchMode: this.batchMode,
      selectedCount: this.selectedTabIds.size,
      totalTabs: allTabs.length,
      closableCount: selectedTabs.filter(tab => tab.closable).length,
      pinnedCount: selectedTabs.filter(tab => tab.pinned).length,
    }
  }

  /**
   * 销毁批量操作管理器
   * 
   * 清理所有资源。
   */
  destroy(): void {
    this.selectedTabIds.clear()
    this.batchMode = false
  }
}

/**
 * 创建批量操作管理器
 * 
 * @param tabManager - 标签管理器实例
 * @returns 批量操作管理器实例
 * 
 * @example
 * ```typescript
 * const batchOps = createBatchOperationsManager(tabManager)
 * ```
 */
export function createBatchOperationsManager(tabManager: TabManager): BatchOperationsManager {
  return new BatchOperationsManager(tabManager)
}


