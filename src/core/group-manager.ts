/**
 * 标签分组管理器
 * 
 * 提供标签分组功能，支持将标签组织成不同的逻辑分组。
 * 每个分组可以折叠/展开、自定义颜色、批量操作等。
 * 
 * 主要功能：
 * - 创建、编辑、删除分组
 * - 分组折叠/展开
 * - 标签在分组间移动
 * - 分组颜色标记
 * - 分组持久化存储
 * 
 * @example
 * ```typescript
 * const groupManager = new GroupManager(tabManager)
 * 
 * // 创建分组
 * const group = groupManager.createGroup('开发', ['tab1', 'tab2'])
 * 
 * // 折叠分组
 * groupManager.toggleGroup(group.id)
 * ```
 */

import { nanoid } from 'nanoid'
import type { TabEventEmitter, TabGroup, TabGroupConfig } from '../types'
import type { TabManager } from './manager'
import { deepClone } from '../utils'

/**
 * 预设的分组颜色
 */
export const GROUP_COLORS = [
  '#1890ff', // 蓝色
  '#52c41a', // 绿色
  '#faad14', // 黄色
  '#f5222d', // 红色
  '#722ed1', // 紫色
  '#13c2c2', // 青色
  '#eb2f96', // 粉色
  '#fa8c16', // 橙色
] as const

/**
 * 分组配置接口
 */
export interface TabGroupConfig {
  /** 分组名称 */
  name: string
  /** 分组颜色（可选，默认第一个颜色） */
  color?: string
  /** 初始标签ID列表（可选） */
  tabIds?: string[]
  /** 是否初始折叠（可选，默认false） */
  collapsed?: boolean
}

/**
 * 分组管理器类
 */
export class GroupManager {
  /** 分组列表 */
  private groups: TabGroup[] = []

  /** 标签管理器引用 */
  private tabManager: TabManager

  /** 事件发射器 */
  private get events(): TabEventEmitter {
    return this.tabManager.events
  }

  /**
   * 构造函数
   * 
   * @param tabManager - 标签管理器实例
   */
  constructor(tabManager: TabManager) {
    this.tabManager = tabManager
  }

  /**
   * 创建分组
   * 
   * 创建一个新的标签分组。可以立即添加标签到分组中。
   * 
   * @param config - 分组配置
   * @returns 创建的分组对象
   * 
   * @example
   * ```typescript
   * const group = groupManager.createGroup({
   *   name: '开发环境',
   *   color: '#1890ff',
   *   tabIds: ['tab1', 'tab2'],
   *   collapsed: false
   * })
   * ```
   */
  createGroup(config: TabGroupConfig): TabGroup {
    const group: TabGroup = {
      id: nanoid(),
      name: config.name,
      color: config.color || GROUP_COLORS[0],
      collapsed: config.collapsed || false,
      tabIds: config.tabIds || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    this.groups.push(group)

    // 触发事件
    this.events.emit({
      type: 'group:create',
      timestamp: Date.now(),
      group: deepClone(group),
    })

    return deepClone(group)
  }

  /**
   * 更新分组
   * 
   * 更新分组的属性，如名称、颜色、折叠状态等。
   * 
   * @param id - 分组ID
   * @param updates - 要更新的字段
   * @returns 更新成功返回true，失败返回false
   * 
   * @example
   * ```typescript
   * groupManager.updateGroup('group_1', {
   *   name: '新名称',
   *   color: '#52c41a'
   * })
   * ```
   */
  updateGroup(id: string, updates: Partial<Omit<TabGroup, 'id' | 'createdAt'>>): boolean {
    const group = this.groups.find(g => g.id === id)
    if (!group) {
      return false
    }

    const oldGroup = deepClone(group)

    Object.assign(group, updates, {
      id: group.id,
      createdAt: group.createdAt,
      updatedAt: Date.now(),
    })

    // 触发事件
    this.events.emit({
      type: 'group:update',
      timestamp: Date.now(),
      group: deepClone(group),
      oldGroup,
    })

    return true
  }

  /**
   * 删除分组
   * 
   * 删除指定的分组。分组中的标签不会被删除，只是从分组中移除。
   * 
   * @param id - 分组ID
   * @returns 删除成功返回true，失败返回false
   * 
   * @example
   * ```typescript
   * groupManager.deleteGroup('group_1')
   * ```
   */
  deleteGroup(id: string): boolean {
    const index = this.groups.findIndex(g => g.id === id)
    if (index === -1) {
      return false
    }

    const group = this.groups[index]
    this.groups.splice(index, 1)

    // 触发事件
    this.events.emit({
      type: 'group:delete',
      timestamp: Date.now(),
      group: deepClone(group),
    })

    return true
  }

  /**
   * 添加标签到分组
   * 
   * 将一个或多个标签添加到指定分组。
   * 一个标签可以属于多个分组。
   * 
   * @param groupId - 分组ID
   * @param tabIds - 标签ID或标签ID数组
   * @returns 添加成功返回true，失败返回false
   * 
   * @example
   * ```typescript
   * // 添加单个标签
   * groupManager.addTabToGroup('group_1', 'tab_1')
   * 
   * // 添加多个标签
   * groupManager.addTabToGroup('group_1', ['tab_1', 'tab_2'])
   * ```
   */
  addTabToGroup(groupId: string, tabIds: string | string[]): boolean {
    const group = this.groups.find(g => g.id === groupId)
    if (!group) {
      return false
    }

    const ids = Array.isArray(tabIds) ? tabIds : [tabIds]

    ids.forEach(tabId => {
      if (!group.tabIds.includes(tabId)) {
        group.tabIds.push(tabId)
      }
    })

    group.updatedAt = Date.now()

    // 触发事件
    this.events.emit({
      type: 'group:add-tab',
      timestamp: Date.now(),
      groupId,
      tabIds: ids,
    })

    return true
  }

  /**
   * 从分组移除标签
   * 
   * 将标签从指定分组中移除，但标签本身不会被删除。
   * 
   * @param groupId - 分组ID
   * @param tabIds - 标签ID或标签ID数组
   * @returns 移除成功返回true，失败返回false
   * 
   * @example
   * ```typescript
   * groupManager.removeTabFromGroup('group_1', 'tab_1')
   * ```
   */
  removeTabFromGroup(groupId: string, tabIds: string | string[]): boolean {
    const group = this.groups.find(g => g.id === groupId)
    if (!group) {
      return false
    }

    const ids = Array.isArray(tabIds) ? tabIds : [tabIds]

    ids.forEach(tabId => {
      const index = group.tabIds.indexOf(tabId)
      if (index !== -1) {
        group.tabIds.splice(index, 1)
      }
    })

    group.updatedAt = Date.now()

    // 触发事件
    this.events.emit({
      type: 'group:remove-tab',
      timestamp: Date.now(),
      groupId,
      tabIds: ids,
    })

    return true
  }

  /**
   * 切换分组的折叠状态
   * 
   * 在折叠和展开之间切换。
   * 
   * @param id - 分组ID
   * @returns 切换后的状态（true为折叠，false为展开）
   * 
   * @example
   * ```typescript
   * const collapsed = groupManager.toggleGroup('group_1')
   * console.log('分组已' + (collapsed ? '折叠' : '展开'))
   * ```
   */
  toggleGroup(id: string): boolean | null {
    const group = this.groups.find(g => g.id === id)
    if (!group) {
      return null
    }

    group.collapsed = !group.collapsed
    group.updatedAt = Date.now()

    // 触发事件
    this.events.emit({
      type: 'group:toggle',
      timestamp: Date.now(),
      groupId: id,
      collapsed: group.collapsed,
    })

    return group.collapsed
  }

  /**
   * 关闭分组中的所有标签
   * 
   * 关闭分组中所有可关闭的标签。
   * 
   * @param id - 分组ID
   * @returns 关闭的标签数量
   * 
   * @example
   * ```typescript
   * const closedCount = groupManager.closeGroup('group_1')
   * console.log(`关闭了 ${closedCount} 个标签`)
   * ```
   */
  closeGroup(id: string): number {
    const group = this.groups.find(g => g.id === id)
    if (!group) {
      return 0
    }

    let closedCount = 0

    // 关闭分组中的每个标签
    group.tabIds.forEach(tabId => {
      if (this.tabManager.removeTab(tabId)) {
        closedCount++
      }
    })

    // 清空分组的标签列表
    if (closedCount > 0) {
      group.tabIds = []
      group.updatedAt = Date.now()

      // 触发事件
      this.events.emit({
        type: 'group:close',
        timestamp: Date.now(),
        groupId: id,
        closedCount,
      })
    }

    return closedCount
  }

  /**
   * 获取分组
   * 
   * 根据ID获取单个分组的完整信息。
   * 
   * @param id - 分组ID
   * @returns 分组对象，未找到返回undefined
   */
  getGroup(id: string): TabGroup | undefined {
    const group = this.groups.find(g => g.id === id)
    return group ? deepClone(group) : undefined
  }

  /**
   * 获取所有分组
   * 
   * @returns 所有分组的数组
   */
  getAllGroups(): TabGroup[] {
    return this.groups.map(group => deepClone(group))
  }

  /**
   * 获取标签所属的所有分组
   * 
   * 一个标签可能属于多个分组。
   * 
   * @param tabId - 标签ID
   * @returns 包含该标签的所有分组
   * 
   * @example
   * ```typescript
   * const groups = groupManager.getTabGroups('tab_1')
   * console.log(`标签属于 ${groups.length} 个分组`)
   * ```
   */
  getTabGroups(tabId: string): TabGroup[] {
    return this.groups
      .filter(group => group.tabIds.includes(tabId))
      .map(group => deepClone(group))
  }

  /**
   * 获取分组的标签数量
   * 
   * @param id - 分组ID
   * @returns 标签数量，分组不存在返回0
   */
  getGroupTabCount(id: string): number {
    const group = this.groups.find(g => g.id === id)
    return group ? group.tabIds.length : 0
  }

  /**
   * 清除空分组
   * 
   * 删除所有不包含标签的分组。
   * 
   * @returns 删除的分组数量
   * 
   * @example
   * ```typescript
   * const removed = groupManager.cleanEmptyGroups()
   * console.log(`清理了 ${removed} 个空分组`)
   * ```
   */
  cleanEmptyGroups(): number {
    const beforeCount = this.groups.length

    this.groups = this.groups.filter(group => {
      if (group.tabIds.length === 0) {
        // 触发删除事件
        this.events.emit({
          type: 'group:delete',
          timestamp: Date.now(),
          group: deepClone(group),
        })
        return false
      }
      return true
    })

    return beforeCount - this.groups.length
  }

  /**
   * 移动分组
   * 
   * 调整分组的显示顺序。
   * 
   * @param fromIndex - 源索引
   * @param toIndex - 目标索引
   * @returns 移动成功返回true，失败返回false
   */
  moveGroup(fromIndex: number, toIndex: number): boolean {
    if (
      fromIndex < 0 ||
      fromIndex >= this.groups.length ||
      toIndex < 0 ||
      toIndex >= this.groups.length ||
      fromIndex === toIndex
    ) {
      return false
    }

    const [group] = this.groups.splice(fromIndex, 1)
    this.groups.splice(toIndex, 0, group)

    // 触发事件
    this.events.emit({
      type: 'group:move',
      timestamp: Date.now(),
      groupId: group.id,
      fromIndex,
      toIndex,
    })

    return true
  }

  /**
   * 销毁分组管理器
   * 
   * 清理所有资源。
   */
  destroy(): void {
    this.groups = []
  }
}

/**
 * 创建分组管理器
 * 
 * 工厂函数：创建并返回一个分组管理器实例。
 * 
 * @param tabManager - 标签管理器实例
 * @returns 分组管理器实例
 * 
 * @example
 * ```typescript
 * const groupManager = createGroupManager(tabManager)
 * ```
 */
export function createGroupManager(tabManager: TabManager): GroupManager {
  return new GroupManager(tabManager)
}


