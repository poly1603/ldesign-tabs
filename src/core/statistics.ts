/**
 * 标签统计分析器
 * 
 * 提供标签使用情况的统计和分析功能。
 * 帮助用户了解标签使用习惯，优化工作流程。
 * 
 * 主要功能：
 * - 访问次数统计
 * - 停留时间统计
 * - 访问时间分布
 * - 热门标签排行
 * - 标签使用趋势
 * - 数据导出
 * 
 * @example
 * ```typescript
 * const statistics = new StatisticsAnalyzer(tabManager, storage)
 * 
 * // 获取热门标签
 * const popular = statistics.getMostVisitedTabs(10)
 * 
 * // 获取今日统计
 * const today = statistics.getTodayStatistics()
 * ```
 */

import type { Tab, TabEventEmitter, TabStorage } from '../types'
import type { TabManager } from './manager'
import { deepClone } from '../utils'

/**
 * 标签统计数据
 */
export interface TabStatistics {
  /** 路径 */
  path: string
  /** 标题 */
  title: string
  /** 访问次数 */
  visitCount: number
  /** 总停留时间（毫秒） */
  totalDuration: number
  /** 平均停留时间（毫秒） */
  avgDuration: number
  /** 最后访问时间 */
  lastVisit: number
  /** 首次访问时间 */
  firstVisit: number
}

/**
 * 时间段统计
 */
export interface TimeRangeStatistics {
  /** 总访问次数 */
  totalVisits: number
  /** 独立标签数 */
  uniqueTabs: number
  /** 平均每个标签的访问次数 */
  avgVisitsPerTab: number
  /** 总停留时间（毫秒） */
  totalDuration: number
  /** 最常访问的标签 */
  topTabs: TabStatistics[]
}

/**
 * 时间分布数据（按小时）
 */
export interface HourlyDistribution {
  /** 小时（0-23） */
  hour: number
  /** 访问次数 */
  visits: number
}

/**
 * 统计分析器类
 */
export class StatisticsAnalyzer {
  /** 标签管理器引用 */
  private tabManager: TabManager

  /** 存储适配器 */
  private storage: TabStorage

  /** 统计数据缓存 */
  private statsCache: Map<string, TabStatistics> = new Map()

  /** 当前激活标签的开始时间 */
  private currentSessionStart: number = 0

  /** 当前激活的标签ID */
  private currentActiveTabId: string | null = null

  /** 事件发射器 */
  private get events(): TabEventEmitter {
    return this.tabManager.events
  }

  /**
   * 构造函数
   * 
   * @param tabManager - 标签管理器实例
   * @param storage - 存储适配器实例
   * 
   * @example
   * ```typescript
   * const statistics = new StatisticsAnalyzer(tabManager, storage)
   * ```
   */
  constructor(tabManager: TabManager, storage: TabStorage) {
    this.tabManager = tabManager
    this.storage = storage
    this.loadFromStorage()
    this.setupEventListeners()
  }

  /**
   * 设置事件监听器
   * 
   * 监听标签激活事件，自动记录停留时间。
   */
  private setupEventListeners(): void {
    // 监听标签激活
    this.events.on('tab:activate', (event) => {
      // 结束上一个标签的会话
      if (this.currentActiveTabId && this.currentSessionStart > 0) {
        const duration = Date.now() - this.currentSessionStart
        this.recordDuration(this.currentActiveTabId, duration)
      }

      // 开始新标签的会话
      this.currentActiveTabId = event.tab.id
      this.currentSessionStart = Date.now()

      // 记录访问
      this.recordVisit(event.tab)
    })

    // 监听标签移除（结束会话）
    this.events.on('tab:remove', (event) => {
      if (this.currentActiveTabId === event.tab.id && this.currentSessionStart > 0) {
        const duration = Date.now() - this.currentSessionStart
        this.recordDuration(event.tab.id, duration)
        this.currentActiveTabId = null
        this.currentSessionStart = 0
      }
    })
  }

  /**
   * 记录访问
   * 
   * 内部方法：记录标签的访问信息
   */
  private recordVisit(tab: Tab): void {
    const path = tab.path
    let stats = this.statsCache.get(path)

    if (!stats) {
      stats = {
        path,
        title: tab.title,
        visitCount: 0,
        totalDuration: 0,
        avgDuration: 0,
        lastVisit: Date.now(),
        firstVisit: Date.now(),
      }
      this.statsCache.set(path, stats)
    }

    stats.visitCount++
    stats.lastVisit = Date.now()
    stats.title = tab.title // 更新标题（可能变化）

    this.saveToStorage()
  }

  /**
   * 记录停留时间
   * 
   * 内部方法：记录在标签上的停留时间
   */
  private recordDuration(tabId: string, duration: number): void {
    const tab = this.tabManager.getTab(tabId)
    if (!tab) {
      return
    }

    const stats = this.statsCache.get(tab.path)
    if (stats) {
      stats.totalDuration += duration
      stats.avgDuration = stats.totalDuration / stats.visitCount
      this.saveToStorage()
    }
  }

  /**
   * 获取最常访问的标签
   * 
   * @param limit - 数量限制（默认10）
   * @returns 统计数据数组，按访问次数倒序
   * 
   * @example
   * ```typescript
   * const top10 = statistics.getMostVisitedTabs(10)
   * top10.forEach((stat, index) => {
   *   console.log(`${index + 1}. ${stat.title} - ${stat.visitCount}次`)
   * })
   * ```
   */
  getMostVisitedTabs(limit: number = 10): TabStatistics[] {
    return Array.from(this.statsCache.values())
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, limit)
      .map(stat => deepClone(stat))
  }

  /**
   * 获取停留时间最长的标签
   * 
   * @param limit - 数量限制（默认10）
   * @returns 统计数据数组，按总停留时间倒序
   * 
   * @example
   * ```typescript
   * const longestStay = statistics.getLongestStayTabs(10)
   * longestStay.forEach(stat => {
   *   const minutes = Math.round(stat.totalDuration / 60000)
   *   console.log(`${stat.title} - ${minutes}分钟`)
   * })
   * ```
   */
  getLongestStayTabs(limit: number = 10): TabStatistics[] {
    return Array.from(this.statsCache.values())
      .sort((a, b) => b.totalDuration - a.totalDuration)
      .slice(0, limit)
      .map(stat => deepClone(stat))
  }

  /**
   * 获取最近访问的标签
   * 
   * @param limit - 数量限制（默认10）
   * @returns 统计数据数组，按最后访问时间倒序
   * 
   * @example
   * ```typescript
   * const recent = statistics.getRecentlyVisitedTabs(10)
   * ```
   */
  getRecentlyVisitedTabs(limit: number = 10): TabStatistics[] {
    return Array.from(this.statsCache.values())
      .sort((a, b) => b.lastVisit - a.lastVisit)
      .slice(0, limit)
      .map(stat => deepClone(stat))
  }

  /**
   * 获取单个标签的统计信息
   * 
   * @param path - 标签路径
   * @returns 统计信息，未找到返回null
   * 
   * @example
   * ```typescript
   * const stat = statistics.getTabStatistics('/admin/users')
   * if (stat) {
   *   console.log(`访问${stat.visitCount}次，停留${stat.avgDuration}ms`)
   * }
   * ```
   */
  getTabStatistics(path: string): TabStatistics | null {
    const stats = this.statsCache.get(path)
    return stats ? deepClone(stats) : null
  }

  /**
   * 获取今日统计
   * 
   * @returns 今日的统计数据
   * 
   * @example
   * ```typescript
   * const today = statistics.getTodayStatistics()
   * console.log(`今日访问了 ${today.uniqueTabs} 个标签`)
   * console.log(`总访问次数: ${today.totalVisits}`)
   * ```
   */
  getTodayStatistics(): TimeRangeStatistics {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    return this.getTimeRangeStatistics(todayStart.getTime(), Date.now())
  }

  /**
   * 获取本周统计
   * 
   * @returns 本周的统计数据
   */
  getWeekStatistics(): TimeRangeStatistics {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)
    return this.getTimeRangeStatistics(weekStart.getTime(), Date.now())
  }

  /**
   * 获取本月统计
   * 
   * @returns 本月的统计数据
   */
  getMonthStatistics(): TimeRangeStatistics {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    return this.getTimeRangeStatistics(monthStart.getTime(), Date.now())
  }

  /**
   * 获取指定时间范围的统计
   * 
   * @param startTime - 开始时间（毫秒时间戳）
   * @param endTime - 结束时间（毫秒时间戳）
   * @returns 时间范围统计数据
   * 
   * @example
   * ```typescript
   * // 获取最近7天的统计
   * const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
   * const stats = statistics.getTimeRangeStatistics(weekAgo, Date.now())
   * ```
   */
  getTimeRangeStatistics(startTime: number, endTime: number): TimeRangeStatistics {
    const stats = Array.from(this.statsCache.values()).filter(
      stat => stat.lastVisit >= startTime && stat.lastVisit <= endTime
    )

    const totalVisits = stats.reduce((sum, stat) => sum + stat.visitCount, 0)
    const totalDuration = stats.reduce((sum, stat) => sum + stat.totalDuration, 0)
    const uniqueTabs = stats.length

    const topTabs = stats
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, 10)
      .map(stat => deepClone(stat))

    return {
      totalVisits,
      uniqueTabs,
      avgVisitsPerTab: uniqueTabs > 0 ? totalVisits / uniqueTabs : 0,
      totalDuration,
      topTabs,
    }
  }

  /**
   * 获取访问时间分布（按小时）
   * 
   * @returns 24小时的访问分布数据
   * 
   * @example
   * ```typescript
   * const distribution = statistics.getHourlyDistribution()
   * distribution.forEach(item => {
   *   console.log(`${item.hour}点: ${item.visits}次访问`)
   * })
   * ```
   */
  getHourlyDistribution(): HourlyDistribution[] {
    const distribution: HourlyDistribution[] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      visits: 0,
    }))

    // 注意：这需要额外存储每次访问的时间，当前实现只是占位
    // 真实实现需要记录每次访问的详细时间戳

    return distribution
  }

  /**
   * 获取总体统计信息
   * 
   * @returns 总体统计数据
   * 
   * @example
   * ```typescript
   * const overall = statistics.getOverallStatistics()
   * console.log(`
   *   总标签数: ${overall.totalTabs}
   *   总访问次数: ${overall.totalVisits}
   *   总停留时间: ${overall.totalDuration}ms
   *   平均访问次数: ${overall.avgVisitsPerTab}
   * `)
   * ```
   */
  getOverallStatistics(): {
    totalTabs: number
    totalVisits: number
    totalDuration: number
    avgVisitsPerTab: number
    avgDurationPerTab: number
    mostVisitedTab: TabStatistics | null
    longestStayTab: TabStatistics | null
  } {
    const allStats = Array.from(this.statsCache.values())

    const totalTabs = allStats.length
    const totalVisits = allStats.reduce((sum, stat) => sum + stat.visitCount, 0)
    const totalDuration = allStats.reduce((sum, stat) => sum + stat.totalDuration, 0)

    const mostVisited = allStats.length > 0
      ? allStats.reduce((max, stat) => stat.visitCount > max.visitCount ? stat : max)
      : null

    const longestStay = allStats.length > 0
      ? allStats.reduce((max, stat) => stat.totalDuration > max.totalDuration ? stat : max)
      : null

    return {
      totalTabs,
      totalVisits,
      totalDuration,
      avgVisitsPerTab: totalTabs > 0 ? totalVisits / totalTabs : 0,
      avgDurationPerTab: totalTabs > 0 ? totalDuration / totalTabs : 0,
      mostVisitedTab: mostVisited ? deepClone(mostVisited) : null,
      longestStayTab: longestStay ? deepClone(longestStay) : null,
    }
  }

  /**
   * 导出统计数据为CSV
   * 
   * @returns CSV格式的字符串
   * 
   * @example
   * ```typescript
   * const csv = statistics.exportToCSV()
   * // 保存为文件
   * const blob = new Blob([csv], { type: 'text/csv' })
   * const url = URL.createObjectURL(blob)
   * ```
   */
  exportToCSV(): string {
    const header = '标题,路径,访问次数,总停留时间(ms),平均停留时间(ms),最后访问时间\n'

    const rows = Array.from(this.statsCache.values())
      .map(stat => {
        const lastVisit = new Date(stat.lastVisit).toISOString()
        return `"${stat.title}","${stat.path}",${stat.visitCount},${stat.totalDuration},${stat.avgDuration},"${lastVisit}"`
      })
      .join('\n')

    return header + rows
  }

  /**
   * 导出统计数据为JSON
   * 
   * @returns JSON格式的字符串
   * 
   * @example
   * ```typescript
   * const json = statistics.exportToJSON()
   * ```
   */
  exportToJSON(): string {
    const stats = Array.from(this.statsCache.values())
    return JSON.stringify(stats, null, 2)
  }

  /**
   * 清除所有统计数据
   * 
   * @example
   * ```typescript
   * statistics.clearAllStatistics()
   * ```
   */
  clearAllStatistics(): void {
    this.statsCache.clear()
    this.currentSessionStart = 0
    this.currentActiveTabId = null
    this.saveToStorage()

    this.events.emit({
      type: 'statistics:clear',
      timestamp: Date.now(),
    } as any)
  }

  /**
   * 清除指定路径的统计
   * 
   * @param path - 标签路径
   * @returns 删除成功返回true
   * 
   * @example
   * ```typescript
   * statistics.clearTabStatistics('/old-page')
   * ```
   */
  clearTabStatistics(path: string): boolean {
    const deleted = this.statsCache.delete(path)
    if (deleted) {
      this.saveToStorage()
    }
    return deleted
  }

  /**
   * 从存储加载统计数据
   */
  private loadFromStorage(): void {
    const stored = this.storage.loadStatistics()
    if (stored && stored.tabStats) {
      Object.entries(stored.tabStats).forEach(([path, stat]) => {
        this.statsCache.set(path, {
          path: stat.path,
          title: stat.path, // 将在首次访问时更新
          visitCount: stat.visitCount,
          totalDuration: stat.totalDuration,
          avgDuration: stat.visitCount > 0 ? stat.totalDuration / stat.visitCount : 0,
          lastVisit: stat.lastVisit,
          firstVisit: stat.lastVisit, // 近似值
        })
      })
    }
  }

  /**
   * 保存统计数据到存储
   */
  private saveToStorage(): void {
    const tabStats: Record<string, any> = {}

    this.statsCache.forEach((stat, path) => {
      tabStats[path] = {
        path: stat.path,
        visitCount: stat.visitCount,
        totalDuration: stat.totalDuration,
        lastVisit: stat.lastVisit,
      }
    })

    this.storage.saveStatistics({
      tabStats,
      timestamp: Date.now(),
    })
  }

  /**
   * 销毁统计分析器
   */
  destroy(): void {
    // 结束当前会话
    if (this.currentActiveTabId && this.currentSessionStart > 0) {
      const duration = Date.now() - this.currentSessionStart
      this.recordDuration(this.currentActiveTabId, duration)
    }

    this.statsCache.clear()
  }
}

/**
 * 创建统计分析器
 * 
 * @param tabManager - 标签管理器实例
 * @param storage - 存储适配器实例
 * @returns 统计分析器实例
 * 
 * @example
 * ```typescript
 * const statistics = createStatisticsAnalyzer(tabManager, storage)
 * ```
 */
export function createStatisticsAnalyzer(tabManager: TabManager, storage: TabStorage): StatisticsAnalyzer {
  return new StatisticsAnalyzer(tabManager, storage)
}


