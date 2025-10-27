/**
 * 标签搜索引擎
 * 
 * 提供强大的标签搜索功能，支持模糊搜索、高级过滤等。
 * 帮助用户在大量标签中快速定位目标标签。
 * 
 * 主要功能：
 * - 模糊搜索（标题、路径、元数据）
 * - 高级过滤（按状态、分组、固定等）
 * - 搜索历史记录
 * - 搜索结果排序
 * 
 * @example
 * ```typescript
 * const searchEngine = new SearchEngine(tabManager)
 * 
 * // 简单搜索
 * const results = searchEngine.search('用户')
 * 
 * // 高级搜索
 * const filtered = searchEngine.advancedSearch({
 *   keyword: '用户',
 *   status: 'normal',
 *   pinned: false
 * })
 * ```
 */

import type { Tab, TabStatus, TabEventEmitter } from '../types'
import type { TabManager } from './manager'
import { deepClone } from '../utils'

/**
 * 搜索选项
 */
export interface SearchOptions {
  /** 搜索关键词 */
  keyword?: string
  /** 按状态过滤 */
  status?: TabStatus
  /** 按固定状态过滤 */
  pinned?: boolean
  /** 按分组过滤 */
  groupId?: string
  /** 最小访问次数 */
  minVisitCount?: number
  /** 时间范围（开始） */
  startTime?: number
  /** 时间范围（结束） */
  endTime?: number
  /** 搜索字段 */
  searchFields?: ('title' | 'path' | 'meta')[]
  /** 排序方式 */
  sortBy?: 'relevance' | 'visitCount' | 'lastAccessed' | 'title'
  /** 排序顺序 */
  sortOrder?: 'asc' | 'desc'
  /** 最大结果数量 */
  limit?: number
}

/**
 * 搜索结果项
 */
export interface SearchResult {
  /** 标签对象 */
  tab: Tab
  /** 相关度评分（0-100） */
  score: number
  /** 匹配的字段 */
  matchedFields: string[]
  /** 高亮的文本片段 */
  highlights: {
    field: string
    text: string
    start: number
    end: number
  }[]
}

/**
 * 搜索历史项
 */
export interface SearchHistoryItem {
  /** 搜索关键词 */
  keyword: string
  /** 搜索时间 */
  timestamp: number
  /** 结果数量 */
  resultCount: number
}

/**
 * 搜索引擎类
 */
export class SearchEngine {
  /** 标签管理器引用 */
  private tabManager: TabManager

  /** 搜索历史（最多20条） */
  private searchHistory: SearchHistoryItem[] = []

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
   * const searchEngine = new SearchEngine(tabManager)
   * ```
   */
  constructor(tabManager: TabManager) {
    this.tabManager = tabManager
  }

  /**
   * 简单搜索
   * 
   * 根据关键词在标题、路径和元数据中搜索标签。
   * 使用模糊匹配算法，按相关度排序。
   * 
   * @param keyword - 搜索关键词
   * @param options - 可选配置
   * @returns 搜索结果数组
   * 
   * @example
   * ```typescript
   * // 搜索包含"用户"的标签
   * const results = searchEngine.search('用户')
   * 
   * // 限制结果数量
   * const top5 = searchEngine.search('用户', { limit: 5 })
   * 
   * results.forEach(result => {
   *   console.log(`${result.tab.title} - 相关度: ${result.score}`)
   * })
   * ```
   */
  search(keyword: string, options: Partial<SearchOptions> = {}): SearchResult[] {
    if (!keyword || keyword.trim() === '') {
      return []
    }

    const normalizedKeyword = keyword.trim().toLowerCase()
    const tabs = this.tabManager.getAllTabs()
    const searchFields = options.searchFields || ['title', 'path', 'meta']
    const results: SearchResult[] = []

    tabs.forEach((tab) => {
      const matchInfo = this.matchTab(tab, normalizedKeyword, searchFields)

      if (matchInfo.matched) {
        results.push({
          tab: deepClone(tab),
          score: matchInfo.score,
          matchedFields: matchInfo.matchedFields,
          highlights: matchInfo.highlights,
        })
      }
    })

    // 排序
    const sortedResults = this.sortResults(results, options.sortBy || 'relevance', options.sortOrder || 'desc')

    // 限制结果数量
    const limitedResults = options.limit ? sortedResults.slice(0, options.limit) : sortedResults

    // 记录搜索历史
    this.addToHistory(keyword, limitedResults.length)

    return limitedResults
  }

  /**
   * 高级搜索
   * 
   * 支持多条件组合搜索，可以按状态、分组、时间等多个维度过滤。
   * 
   * @param options - 搜索选项
   * @returns 搜索结果数组
   * 
   * @example
   * ```typescript
   * // 搜索最近7天访问过的普通标签
   * const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
   * const results = searchEngine.advancedSearch({
   *   status: 'normal',
   *   pinned: false,
   *   startTime: weekAgo,
   *   sortBy: 'lastAccessed'
   * })
   * 
   * // 搜索访问次数超过10次的标签
   * const popular = searchEngine.advancedSearch({
   *   minVisitCount: 10,
   *   sortBy: 'visitCount',
   *   sortOrder: 'desc'
   * })
   * ```
   */
  advancedSearch(options: SearchOptions): SearchResult[] {
    let tabs = this.tabManager.getAllTabs()

    // 应用各种过滤器
    tabs = this.applyFilters(tabs, options)

    // 如果有关键词，进行匹配
    let results: SearchResult[]
    if (options.keyword && options.keyword.trim() !== '') {
      const normalizedKeyword = options.keyword.trim().toLowerCase()
      const searchFields = options.searchFields || ['title', 'path', 'meta']

      results = tabs
        .map((tab) => {
          const matchInfo = this.matchTab(tab, normalizedKeyword, searchFields)
          return {
            tab: deepClone(tab),
            score: matchInfo.score,
            matchedFields: matchInfo.matchedFields,
            highlights: matchInfo.highlights,
          }
        })
        .filter(result => result.score > 0)
    } else {
      // 没有关键词，返回所有符合条件的标签
      results = tabs.map(tab => ({
        tab: deepClone(tab),
        score: 100,
        matchedFields: [],
        highlights: [],
      }))
    }

    // 排序
    const sortedResults = this.sortResults(results, options.sortBy || 'relevance', options.sortOrder || 'desc')

    // 限制结果数量
    const limitedResults = options.limit ? sortedResults.slice(0, options.limit) : sortedResults

    // 记录搜索历史
    if (options.keyword) {
      this.addToHistory(options.keyword, limitedResults.length)
    }

    return limitedResults
  }

  /**
   * 获取搜索历史
   * 
   * @returns 搜索历史数组（最新的在前）
   * 
   * @example
   * ```typescript
   * const history = searchEngine.getSearchHistory()
   * history.forEach(item => {
   *   console.log(`${item.keyword} - ${item.resultCount}个结果`)
   * })
   * ```
   */
  getSearchHistory(): SearchHistoryItem[] {
    return [...this.searchHistory]
  }

  /**
   * 清除搜索历史
   * 
   * @example
   * ```typescript
   * searchEngine.clearSearchHistory()
   * ```
   */
  clearSearchHistory(): void {
    this.searchHistory = []
  }

  /**
   * 高亮搜索结果
   * 
   * 将搜索结果中的关键词高亮显示。
   * 
   * @param text - 原始文本
   * @param keyword - 搜索关键词
   * @returns 高亮后的HTML字符串
   * 
   * @example
   * ```typescript
   * const html = searchEngine.highlightText('用户管理页面', '用户')
   * // 返回: '<mark>用户</mark>管理页面'
   * ```
   */
  highlightText(text: string, keyword: string): string {
    if (!keyword || !text) {
      return text
    }

    const normalizedKeyword = keyword.trim().toLowerCase()
    const normalizedText = text.toLowerCase()
    const index = normalizedText.indexOf(normalizedKeyword)

    if (index === -1) {
      return text
    }

    const before = text.substring(0, index)
    const match = text.substring(index, index + keyword.length)
    const after = text.substring(index + keyword.length)

    return `${before}<mark>${match}</mark>${after}`
  }

  /**
   * 匹配标签
   * 
   * 内部方法：计算标签与关键词的匹配度
   */
  private matchTab(
    tab: Tab,
    keyword: string,
    searchFields: string[]
  ): {
    matched: boolean
    score: number
    matchedFields: string[]
    highlights: SearchResult['highlights']
  } {
    let score = 0
    const matchedFields: string[] = []
    const highlights: SearchResult['highlights'] = []

    // 搜索标题
    if (searchFields.includes('title')) {
      const titleMatch = this.calculateMatchScore(tab.title, keyword)
      if (titleMatch.score > 0) {
        score += titleMatch.score * 2 // 标题权重更高
        matchedFields.push('title')
        if (titleMatch.index !== -1) {
          highlights.push({
            field: 'title',
            text: tab.title,
            start: titleMatch.index,
            end: titleMatch.index + keyword.length,
          })
        }
      }
    }

    // 搜索路径
    if (searchFields.includes('path')) {
      const pathMatch = this.calculateMatchScore(tab.path, keyword)
      if (pathMatch.score > 0) {
        score += pathMatch.score
        matchedFields.push('path')
        if (pathMatch.index !== -1) {
          highlights.push({
            field: 'path',
            text: tab.path,
            start: pathMatch.index,
            end: pathMatch.index + keyword.length,
          })
        }
      }
    }

    // 搜索元数据
    if (searchFields.includes('meta') && tab.meta) {
      const metaString = JSON.stringify(tab.meta).toLowerCase()
      const metaMatch = this.calculateMatchScore(metaString, keyword)
      if (metaMatch.score > 0) {
        score += metaMatch.score * 0.5 // 元数据权重较低
        matchedFields.push('meta')
      }
    }

    return {
      matched: score > 0,
      score: Math.min(100, score),
      matchedFields,
      highlights,
    }
  }

  /**
   * 计算匹配评分
   * 
   * 内部方法：计算文本与关键词的匹配度
   */
  private calculateMatchScore(text: string, keyword: string): { score: number; index: number } {
    const normalizedText = text.toLowerCase()
    const index = normalizedText.indexOf(keyword)

    if (index === -1) {
      return { score: 0, index: -1 }
    }

    // 完全匹配得分最高
    if (normalizedText === keyword) {
      return { score: 100, index }
    }

    // 从开头匹配得分较高
    if (index === 0) {
      return { score: 80, index }
    }

    // 包含关键词
    return { score: 60, index }
  }

  /**
   * 应用过滤器
   * 
   * 内部方法：根据选项过滤标签
   */
  private applyFilters(tabs: Tab[], options: SearchOptions): Tab[] {
    let filtered = tabs

    // 按状态过滤
    if (options.status) {
      filtered = filtered.filter(tab => tab.status === options.status)
    }

    // 按固定状态过滤
    if (options.pinned !== undefined) {
      filtered = filtered.filter(tab => tab.pinned === options.pinned)
    }

    // 按访问次数过滤
    if (options.minVisitCount !== undefined) {
      filtered = filtered.filter(tab => tab.visitCount >= options.minVisitCount!)
    }

    // 按时间范围过滤
    if (options.startTime !== undefined) {
      filtered = filtered.filter(tab => tab.lastAccessedAt >= options.startTime!)
    }

    if (options.endTime !== undefined) {
      filtered = filtered.filter(tab => tab.lastAccessedAt <= options.endTime!)
    }

    return filtered
  }

  /**
   * 排序结果
   * 
   * 内部方法：对搜索结果进行排序
   */
  private sortResults(
    results: SearchResult[],
    sortBy: SearchOptions['sortBy'],
    sortOrder: SearchOptions['sortOrder']
  ): SearchResult[] {
    const sorted = [...results]
    const order = sortOrder === 'asc' ? 1 : -1

    sorted.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'relevance':
          comparison = a.score - b.score
          break
        case 'visitCount':
          comparison = a.tab.visitCount - b.tab.visitCount
          break
        case 'lastAccessed':
          comparison = a.tab.lastAccessedAt - b.tab.lastAccessedAt
          break
        case 'title':
          comparison = a.tab.title.localeCompare(b.tab.title)
          break
        default:
          comparison = a.score - b.score
      }

      return comparison * order
    })

    return sorted
  }

  /**
   * 添加到搜索历史
   * 
   * 内部方法：记录搜索历史
   */
  private addToHistory(keyword: string, resultCount: number): void {
    // 移除已存在的相同关键词
    this.searchHistory = this.searchHistory.filter(item => item.keyword !== keyword)

    // 添加到开头
    this.searchHistory.unshift({
      keyword,
      timestamp: Date.now(),
      resultCount,
    })

    // 保持最多20条
    if (this.searchHistory.length > 20) {
      this.searchHistory = this.searchHistory.slice(0, 20)
    }
  }

  /**
   * 销毁搜索引擎
   */
  destroy(): void {
    this.searchHistory = []
  }
}

/**
 * 创建搜索引擎
 * 
 * @param tabManager - 标签管理器实例
 * @returns 搜索引擎实例
 * 
 * @example
 * ```typescript
 * const searchEngine = createSearchEngine(tabManager)
 * ```
 */
export function createSearchEngine(tabManager: TabManager): SearchEngine {
  return new SearchEngine(tabManager)
}


