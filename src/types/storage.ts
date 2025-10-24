/**
 * 存储类型定义
 */

import type { Tab, TabGroup, TabTemplate } from './tab'

/**
 * 存储的标签页状态
 */
export interface StoredTabsState {
  /** 标签列表 */
  tabs: Tab[]
  /** 当前激活的标签ID */
  activeTabId: string | null
  /** 时间戳 */
  timestamp: number
  /** 版本号（用于迁移） */
  version: string
}

/**
 * 存储的历史记录
 */
export interface StoredHistory {
  /** 关闭的标签列表（最多20条） */
  closedTabs: Array<{
    tab: Tab
    closedAt: number
    index: number
  }>
  /** 时间戳 */
  timestamp: number
}

/**
 * 存储的标签组
 */
export interface StoredGroups {
  /** 标签组列表 */
  groups: TabGroup[]
  /** 时间戳 */
  timestamp: number
}

/**
 * 存储的标签模板
 */
export interface StoredTemplates {
  /** 模板列表 */
  templates: TabTemplate[]
  /** 时间戳 */
  timestamp: number
}

/**
 * 存储的使用统计
 */
export interface StoredStatistics {
  /** 标签访问统计 */
  tabStats: Record<string, {
    /** 路径 */
    path: string
    /** 访问次数 */
    visitCount: number
    /** 总停留时间（ms） */
    totalDuration: number
    /** 最后访问时间 */
    lastVisit: number
  }>
  /** 时间戳 */
  timestamp: number
}

/**
 * 存储接口
 */
export interface TabStorage {
  /** 保存标签状态 */
  saveTabs(state: StoredTabsState): void
  /** 加载标签状态 */
  loadTabs(): StoredTabsState | null
  /** 保存历史记录 */
  saveHistory(history: StoredHistory): void
  /** 加载历史记录 */
  loadHistory(): StoredHistory | null
  /** 保存标签组 */
  saveGroups(groups: StoredGroups): void
  /** 加载标签组 */
  loadGroups(): StoredGroups | null
  /** 保存模板 */
  saveTemplates(templates: StoredTemplates): void
  /** 加载模板 */
  loadTemplates(): StoredTemplates | null
  /** 保存统计数据 */
  saveStatistics(stats: StoredStatistics): void
  /** 加载统计数据 */
  loadStatistics(): StoredStatistics | null
  /** 清除所有数据 */
  clear(): void
}


