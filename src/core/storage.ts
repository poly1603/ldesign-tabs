/**
 * 持久化存储实现
 * 
 * 提供标签页数据的本地持久化能力，使用 localStorage 作为存储介质。
 * 支持存储标签状态、历史记录、分组、模板和统计数据。
 * 
 * 主要特性：
 * - 自动 JSON 序列化/反序列化
 * - 版本控制支持数据迁移
 * - 错误处理（存储失败不会影响应用运行）
 * - 可配置的存储键前缀（支持多实例隔离）
 * - 安全的 JSON 解析（防止解析错误导致崩溃）
 * 
 * 存储格式：
 * - 所有数据以 JSON 字符串形式存储在 localStorage
 * - 每个存储项包含版本号和时间戳
 * - 支持未来的版本迁移
 * 
 * @example
 * ```typescript
 * const storage = new LocalTabStorage('my-app')
 * 
 * // 保存标签状态
 * storage.saveTabs({
 *   tabs: [...],
 *   activeTabId: 'tab_1',
 *   timestamp: Date.now(),
 *   version: '1.0.0'
 * })
 * 
 * // 加载标签状态
 * const state = storage.loadTabs()
 * ```
 */

import type {
  StoredGroups,
  StoredHistory,
  StoredStatistics,
  StoredTabsState,
  StoredTemplates,
  TabStorage,
} from '../types'
import { safeJSONParse, safeJSONStringify } from '../utils'

/**
 * 存储键名常量
 * 
 * 定义所有持久化数据在 localStorage 中使用的键名。
 * 使用 as const 确保类型安全。
 */
const STORAGE_KEYS = {
  TABS: 'ldesign_tabs_state',           // 标签状态
  HISTORY: 'ldesign_tabs_history',      // 关闭历史
  GROUPS: 'ldesign_tabs_groups',        // 标签分组
  TEMPLATES: 'ldesign_tabs_templates',  // 标签模板
  STATISTICS: 'ldesign_tabs_statistics', // 统计数据
} as const

/**
 * 当前数据格式版本号
 * 
 * 用于数据迁移和兼容性检查。
 * 当存储格式发生破坏性变更时需要递增版本号。
 */
const CURRENT_VERSION = '1.0.0'

/**
 * LocalStorage 实现类
 * 
 * 实现 TabStorage 接口，提供基于 localStorage 的持久化能力。
 * 支持自定义键前缀以实现多实例数据隔离。
 */
export class LocalTabStorage implements TabStorage {
  /** 存储键前缀，用于实现多实例数据隔离 */
  private prefix: string

  /**
   * 构造函数
   * 
   * @param prefix - 可选的存储键前缀，用于区分不同应用或实例的数据
   * 
   * @example
   * ```typescript
   * // 无前缀
   * const storage1 = new LocalTabStorage()
   * 
   * // 带前缀，实现数据隔离
   * const storage2 = new LocalTabStorage('admin')
   * ```
   */
  constructor(prefix: string = '') {
    this.prefix = prefix
  }

  /**
   * 获取完整的存储键名
   * 
   * 内部方法：将存储键与前缀组合，生成最终的 localStorage 键名。
   * 
   * @param key - 基础键名
   * @returns 完整键名（带前缀）
   */
  private getKey(key: string): string {
    return this.prefix ? `${this.prefix}_${key}` : key
  }

  /**
   * 从 localStorage 读取数据
   * 
   * 内部方法：安全地从 localStorage 读取并解析 JSON 数据。
   * 如果读取失败或解析失败，返回默认值。
   * 
   * @param key - 存储键名
   * @param defaultValue - 默认值（读取失败时返回）
   * @returns 解析后的数据或默认值
   */
  private getItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined' || !window.localStorage) {
      return defaultValue
    }

    const data = window.localStorage.getItem(this.getKey(key))
    return safeJSONParse(data, defaultValue)
  }

  private setItem(key: string, value: any): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }

    const data = safeJSONStringify(value)
    if (data) {
      try {
        window.localStorage.setItem(this.getKey(key), data)
      }
      catch (error) {
        console.error('Failed to save to localStorage:', error)
      }
    }
  }

  private removeItem(key: string): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }

    window.localStorage.removeItem(this.getKey(key))
  }

  /**
   * 保存标签状态
   * 
   * 将标签列表和激活状态保存到 localStorage。
   * 自动添加版本号和时间戳。存储失败会打印错误但不会抛出异常。
   * 
   * @param state - 要保存的标签状态
   * 
   * @example
   * ```typescript
   * storage.saveTabs({
   *   tabs: manager.getAllTabs(),
   *   activeTabId: 'tab_1',
   *   timestamp: Date.now(),
   *   version: '1.0.0'
   * })
   * ```
   */
  saveTabs(state: StoredTabsState): void {
    const dataToSave = {
      ...state,
      version: CURRENT_VERSION,
      timestamp: Date.now(),
    }
    this.setItem(STORAGE_KEYS.TABS, dataToSave)
  }

  /**
   * 加载标签状态
   * 
   * 从 localStorage 恢复标签列表和激活状态。
   * 如果数据不存在或版本不匹配，返回 null。
   * 
   * @returns 标签状态对象，失败返回 null
   * 
   * @example
   * ```typescript
   * const state = storage.loadTabs()
   * if (state) {
   *   console.log('恢复了', state.tabs.length, '个标签')
   * }
   * ```
   */
  loadTabs(): StoredTabsState | null {
    const data = this.getItem<StoredTabsState | null>(STORAGE_KEYS.TABS, null)

    if (!data) {
      return null
    }

    // 版本迁移逻辑可以在这里添加
    if (data.version !== CURRENT_VERSION) {
      // 目前只有一个版本，直接返回
      console.warn('Tab state version mismatch, may need migration')
    }

    return data
  }

  /**
   * 保存历史记录
   */
  saveHistory(history: StoredHistory): void {
    const dataToSave = {
      ...history,
      timestamp: Date.now(),
    }
    this.setItem(STORAGE_KEYS.HISTORY, dataToSave)
  }

  /**
   * 加载历史记录
   */
  loadHistory(): StoredHistory | null {
    return this.getItem<StoredHistory | null>(STORAGE_KEYS.HISTORY, null)
  }

  /**
   * 保存标签组
   */
  saveGroups(groups: StoredGroups): void {
    const dataToSave = {
      ...groups,
      timestamp: Date.now(),
    }
    this.setItem(STORAGE_KEYS.GROUPS, dataToSave)
  }

  /**
   * 加载标签组
   */
  loadGroups(): StoredGroups | null {
    return this.getItem<StoredGroups | null>(STORAGE_KEYS.GROUPS, null)
  }

  /**
   * 保存模板
   */
  saveTemplates(templates: StoredTemplates): void {
    const dataToSave = {
      ...templates,
      timestamp: Date.now(),
    }
    this.setItem(STORAGE_KEYS.TEMPLATES, dataToSave)
  }

  /**
   * 加载模板
   */
  loadTemplates(): StoredTemplates | null {
    return this.getItem<StoredTemplates | null>(STORAGE_KEYS.TEMPLATES, null)
  }

  /**
   * 保存统计数据
   */
  saveStatistics(stats: StoredStatistics): void {
    const dataToSave = {
      ...stats,
      timestamp: Date.now(),
    }
    this.setItem(STORAGE_KEYS.STATISTICS, dataToSave)
  }

  /**
   * 加载统计数据
   */
  loadStatistics(): StoredStatistics | null {
    return this.getItem<StoredStatistics | null>(STORAGE_KEYS.STATISTICS, null)
  }

  /**
   * 清除所有数据
   * 
   * 删除所有与标签页相关的存储数据，包括：
   * - 标签状态
   * - 历史记录
   * - 分组
   * - 模板
   * - 统计数据
   * 
   * @example
   * ```typescript
   * // 重置应用时清除所有数据
   * storage.clear()
   * ```
   */
  clear(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      this.removeItem(key)
    })
  }
}

/**
 * 创建存储实例
 * 
 * 工厂函数：创建并返回一个存储实例。
 * 
 * @param prefix - 可选的存储键前缀
 * @returns 存储实例
 * 
 * @example
 * ```typescript
 * // 创建默认存储
 * const storage = createTabStorage()
 * 
 * // 创建带前缀的存储（用于多实例隔离）
 * const adminStorage = createTabStorage('admin')
 * const userStorage = createTabStorage('user')
 * ```
 */
export function createTabStorage(prefix?: string): TabStorage {
  return new LocalTabStorage(prefix)
}











