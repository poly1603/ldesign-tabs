/**
 * 持久化存储实现
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
 * 存储键名
 */
const STORAGE_KEYS = {
  TABS: 'ldesign_tabs_state',
  HISTORY: 'ldesign_tabs_history',
  GROUPS: 'ldesign_tabs_groups',
  TEMPLATES: 'ldesign_tabs_templates',
  STATISTICS: 'ldesign_tabs_statistics',
} as const

/**
 * 当前版本号
 */
const CURRENT_VERSION = '1.0.0'

/**
 * LocalStorage 实现
 */
export class LocalTabStorage implements TabStorage {
  private prefix: string

  constructor(prefix: string = '') {
    this.prefix = prefix
  }

  private getKey(key: string): string {
    return this.prefix ? `${this.prefix}_${key}` : key
  }

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
   */
  clear(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      this.removeItem(key)
    })
  }
}

/**
 * 创建存储实例
 */
export function createTabStorage(prefix?: string): TabStorage {
  return new LocalTabStorage(prefix)
}











