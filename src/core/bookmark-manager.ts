/**
 * 标签书签管理器
 * 
 * 提供标签书签功能，允许用户收藏常用标签以便快速访问。
 * 支持分类管理、导入导出等功能。
 * 
 * 主要功能：
 * - 收藏标签为书签
 * - 书签分类管理
 * - 快速访问书签
 * - 书签持久化存储
 * - 导入/导出书签
 * 
 * @example
 * ```typescript
 * const bookmarkManager = new BookmarkManager(tabManager, storage)
 * 
 * // 收藏标签
 * const bookmark = bookmarkManager.addBookmark({
 *   title: '用户管理',
 *   path: '/admin/users',
 *   category: '管理'
 * })
 * 
 * // 打开书签
 * bookmarkManager.openBookmark(bookmark.id)
 * ```
 */

import { nanoid } from 'nanoid'
import type { TabConfig, TabEventEmitter, TabStorage } from '../types'
import type { TabManager } from './manager'
import { deepClone } from '../utils'

/**
 * 书签接口
 */
export interface Bookmark {
  /** 书签ID */
  id: string
  /** 标题 */
  title: string
  /** 路径 */
  path: string
  /** 图标 */
  icon?: string
  /** 分类 */
  category: string
  /** 描述 */
  description?: string
  /** 元数据 */
  meta?: Record<string, any>
  /** 创建时间 */
  createdAt: number
  /** 最后访问时间 */
  lastAccessedAt?: number
  /** 访问次数 */
  accessCount: number
}

/**
 * 书签配置
 */
export interface BookmarkConfig {
  /** 标题 */
  title: string
  /** 路径 */
  path: string
  /** 图标（可选） */
  icon?: string
  /** 分类（可选，默认"默认"） */
  category?: string
  /** 描述（可选） */
  description?: string
  /** 元数据（可选） */
  meta?: Record<string, any>
}

/**
 * 书签分类
 */
export interface BookmarkCategory {
  /** 分类名称 */
  name: string
  /** 分类颜色 */
  color?: string
  /** 书签数量 */
  count: number
}

/**
 * 书签管理器类
 */
export class BookmarkManager {
  /** 书签列表 */
  private bookmarks: Bookmark[] = []

  /** 标签管理器引用 */
  private tabManager: TabManager

  /** 存储适配器 */
  private storage: TabStorage

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
   * const bookmarkManager = new BookmarkManager(tabManager, storage)
   * ```
   */
  constructor(tabManager: TabManager, storage: TabStorage) {
    this.tabManager = tabManager
    this.storage = storage
    this.loadFromStorage()
  }

  /**
   * 添加书签
   * 
   * 将标签添加到书签列表，方便以后快速访问。
   * 
   * @param config - 书签配置
   * @returns 创建的书签对象
   * 
   * @example
   * ```typescript
   * const bookmark = bookmarkManager.addBookmark({
   *   title: '用户管理',
   *   path: '/admin/users',
   *   icon: '👥',
   *   category: '管理后台',
   *   description: '用户列表和权限管理'
   * })
   * ```
   */
  addBookmark(config: BookmarkConfig): Bookmark {
    // 检查是否已存在
    const existing = this.bookmarks.find(b => b.path === config.path)
    if (existing) {
      // 如果已存在，更新访问时间
      existing.lastAccessedAt = Date.now()
      existing.accessCount++
      this.saveToStorage()
      return deepClone(existing)
    }

    const bookmark: Bookmark = {
      id: nanoid(),
      title: config.title,
      path: config.path,
      icon: config.icon,
      category: config.category || '默认',
      description: config.description,
      meta: config.meta,
      createdAt: Date.now(),
      accessCount: 0,
    }

    this.bookmarks.push(bookmark)

    // 触发事件
    this.events.emit({
      type: 'bookmark:add',
      timestamp: Date.now(),
      bookmark: deepClone(bookmark),
    } as any)

    // 持久化
    this.saveToStorage()

    return deepClone(bookmark)
  }

  /**
   * 从当前标签创建书签
   * 
   * 将指定的标签页添加到书签。
   * 
   * @param tabId - 标签ID
   * @param category - 可选的分类名称
   * @returns 创建的书签对象，失败返回null
   * 
   * @example
   * ```typescript
   * // 收藏当前激活的标签
   * const activeTab = tabManager.getActiveTab()
   * if (activeTab) {
   *   const bookmark = bookmarkManager.addBookmarkFromTab(activeTab.id, '常用')
   * }
   * ```
   */
  addBookmarkFromTab(tabId: string, category?: string): Bookmark | null {
    const tab = this.tabManager.getTab(tabId)
    if (!tab) {
      return null
    }

    return this.addBookmark({
      title: tab.title,
      path: tab.path,
      icon: tab.icon,
      category: category || '默认',
      meta: tab.meta,
    })
  }

  /**
   * 更新书签
   * 
   * @param id - 书签ID
   * @param updates - 要更新的字段
   * @returns 更新成功返回true
   * 
   * @example
   * ```typescript
   * bookmarkManager.updateBookmark('bookmark_1', {
   *   title: '新标题',
   *   category: '新分类'
   * })
   * ```
   */
  updateBookmark(id: string, updates: Partial<Omit<Bookmark, 'id' | 'createdAt'>>): boolean {
    const bookmark = this.bookmarks.find(b => b.id === id)
    if (!bookmark) {
      return false
    }

    const oldBookmark = deepClone(bookmark)

    Object.assign(bookmark, updates, {
      id: bookmark.id,
      createdAt: bookmark.createdAt,
    })

    // 触发事件
    this.events.emit({
      type: 'bookmark:update',
      timestamp: Date.now(),
      bookmark: deepClone(bookmark),
      oldBookmark,
    } as any)

    // 持久化
    this.saveToStorage()

    return true
  }

  /**
   * 删除书签
   * 
   * @param id - 书签ID
   * @returns 删除成功返回true
   * 
   * @example
   * ```typescript
   * bookmarkManager.deleteBookmark('bookmark_1')
   * ```
   */
  deleteBookmark(id: string): boolean {
    const index = this.bookmarks.findIndex(b => b.id === id)
    if (index === -1) {
      return false
    }

    const bookmark = this.bookmarks[index]
    this.bookmarks.splice(index, 1)

    // 触发事件
    this.events.emit({
      type: 'bookmark:delete',
      timestamp: Date.now(),
      bookmark: deepClone(bookmark),
    } as any)

    // 持久化
    this.saveToStorage()

    return true
  }

  /**
   * 打开书签
   * 
   * 根据书签信息创建或激活对应的标签页。
   * 
   * @param id - 书签ID
   * @returns 成功返回true
   * 
   * @example
   * ```typescript
   * bookmarkManager.openBookmark('bookmark_1')
   * ```
   */
  openBookmark(id: string): boolean {
    const bookmark = this.bookmarks.find(b => b.id === id)
    if (!bookmark) {
      return false
    }

    // 检查是否已存在该标签
    const existingTab = this.tabManager.getAllTabs().find(t => t.path === bookmark.path)
    if (existingTab) {
      // 激活已存在的标签
      this.tabManager.activateTab(existingTab.id)
    } else {
      // 创建新标签
      this.tabManager.addTab({
        title: bookmark.title,
        path: bookmark.path,
        icon: bookmark.icon,
        meta: bookmark.meta,
      })
    }

    // 更新访问信息
    bookmark.lastAccessedAt = Date.now()
    bookmark.accessCount++
    this.saveToStorage()

    // 触发事件
    this.events.emit({
      type: 'bookmark:open',
      timestamp: Date.now(),
      bookmark: deepClone(bookmark),
    } as any)

    return true
  }

  /**
   * 获取单个书签
   * 
   * @param id - 书签ID
   * @returns 书签对象，未找到返回undefined
   */
  getBookmark(id: string): Bookmark | undefined {
    const bookmark = this.bookmarks.find(b => b.id === id)
    return bookmark ? deepClone(bookmark) : undefined
  }

  /**
   * 获取所有书签
   * 
   * @returns 书签数组
   * 
   * @example
   * ```typescript
   * const bookmarks = bookmarkManager.getAllBookmarks()
   * console.log(`共有 ${bookmarks.length} 个书签`)
   * ```
   */
  getAllBookmarks(): Bookmark[] {
    return this.bookmarks.map(bookmark => deepClone(bookmark))
  }

  /**
   * 按分类获取书签
   * 
   * @param category - 分类名称
   * @returns 该分类下的书签数组
   * 
   * @example
   * ```typescript
   * const adminBookmarks = bookmarkManager.getBookmarksByCategory('管理后台')
   * ```
   */
  getBookmarksByCategory(category: string): Bookmark[] {
    return this.bookmarks
      .filter(b => b.category === category)
      .map(b => deepClone(b))
  }

  /**
   * 获取所有分类
   * 
   * @returns 分类数组
   * 
   * @example
   * ```typescript
   * const categories = bookmarkManager.getCategories()
   * categories.forEach(cat => {
   *   console.log(`${cat.name}: ${cat.count}个书签`)
   * })
   * ```
   */
  getCategories(): BookmarkCategory[] {
    const categoryMap = new Map<string, number>()

    this.bookmarks.forEach((bookmark) => {
      const count = categoryMap.get(bookmark.category) || 0
      categoryMap.set(bookmark.category, count + 1)
    })

    const categories: BookmarkCategory[] = []
    categoryMap.forEach((count, name) => {
      categories.push({ name, count })
    })

    return categories
  }

  /**
   * 搜索书签
   * 
   * 根据关键词搜索书签的标题、路径和描述。
   * 
   * @param keyword - 搜索关键词
   * @returns 匹配的书签数组
   * 
   * @example
   * ```typescript
   * const results = bookmarkManager.searchBookmarks('用户')
   * ```
   */
  searchBookmarks(keyword: string): Bookmark[] {
    if (!keyword || keyword.trim() === '') {
      return []
    }

    const normalizedKeyword = keyword.trim().toLowerCase()

    return this.bookmarks
      .filter((bookmark) => {
        const titleMatch = bookmark.title.toLowerCase().includes(normalizedKeyword)
        const pathMatch = bookmark.path.toLowerCase().includes(normalizedKeyword)
        const descMatch = bookmark.description?.toLowerCase().includes(normalizedKeyword)

        return titleMatch || pathMatch || descMatch
      })
      .map(b => deepClone(b))
  }

  /**
   * 获取最近访问的书签
   * 
   * @param limit - 数量限制（默认10）
   * @returns 书签数组，按最后访问时间倒序
   * 
   * @example
   * ```typescript
   * const recent = bookmarkManager.getRecentBookmarks(5)
   * ```
   */
  getRecentBookmarks(limit: number = 10): Bookmark[] {
    return this.bookmarks
      .filter(b => b.lastAccessedAt)
      .sort((a, b) => (b.lastAccessedAt || 0) - (a.lastAccessedAt || 0))
      .slice(0, limit)
      .map(b => deepClone(b))
  }

  /**
   * 获取最常访问的书签
   * 
   * @param limit - 数量限制（默认10）
   * @returns 书签数组，按访问次数倒序
   * 
   * @example
   * ```typescript
   * const popular = bookmarkManager.getMostAccessedBookmarks(5)
   * ```
   */
  getMostAccessedBookmarks(limit: number = 10): Bookmark[] {
    return this.bookmarks
      .filter(b => b.accessCount > 0)
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit)
      .map(b => deepClone(b))
  }

  /**
   * 检查路径是否已收藏
   * 
   * @param path - 路径
   * @returns 如果已收藏返回true
   * 
   * @example
   * ```typescript
   * if (bookmarkManager.isBookmarked('/admin/users')) {
   *   console.log('该页面已收藏')
   * }
   * ```
   */
  isBookmarked(path: string): boolean {
    return this.bookmarks.some(b => b.path === path)
  }

  /**
   * 移动书签到其他分类
   * 
   * @param id - 书签ID
   * @param category - 新分类名称
   * @returns 移动成功返回true
   * 
   * @example
   * ```typescript
   * bookmarkManager.moveToCategory('bookmark_1', '常用')
   * ```
   */
  moveToCategory(id: string, category: string): boolean {
    return this.updateBookmark(id, { category })
  }

  /**
   * 导出书签为JSON
   * 
   * @returns JSON字符串
   * 
   * @example
   * ```typescript
   * const json = bookmarkManager.exportBookmarks()
   * // 保存到文件或复制到剪贴板
   * ```
   */
  exportBookmarks(): string {
    return JSON.stringify(this.bookmarks, null, 2)
  }

  /**
   * 从JSON导入书签
   * 
   * @param json - JSON字符串
   * @returns 导入的书签数量
   * 
   * @example
   * ```typescript
   * const json = await readFileAsText(file)
   * const count = bookmarkManager.importBookmarks(json)
   * console.log(`成功导入 ${count} 个书签`)
   * ```
   */
  importBookmarks(json: string): number {
    try {
      const bookmarks = JSON.parse(json) as Bookmark[]

      if (!Array.isArray(bookmarks)) {
        return 0
      }

      let count = 0

      bookmarks.forEach((bookmark) => {
        // 检查是否已存在
        const exists = this.bookmarks.some(b => b.path === bookmark.path)
        if (!exists && bookmark.title && bookmark.path) {
          // 生成新ID
          bookmark.id = nanoid()
          bookmark.createdAt = Date.now()
          bookmark.accessCount = 0

          this.bookmarks.push(bookmark)
          count++
        }
      })

      if (count > 0) {
        this.saveToStorage()

        this.events.emit({
          type: 'bookmark:import',
          timestamp: Date.now(),
          count,
        } as any)
      }

      return count
    }
    catch {
      return 0
    }
  }

  /**
   * 清除所有书签
   * 
   * @example
   * ```typescript
   * bookmarkManager.clearAllBookmarks()
   * ```
   */
  clearAllBookmarks(): void {
    this.bookmarks = []
    this.saveToStorage()

    this.events.emit({
      type: 'bookmark:clear-all',
      timestamp: Date.now(),
    } as any)
  }

  /**
   * 从存储加载书签
   */
  private loadFromStorage(): void {
    const stored = this.storage.loadBookmarks?.()
    if (stored && stored.bookmarks && Array.isArray(stored.bookmarks)) {
      this.bookmarks = stored.bookmarks
    }
  }

  /**
   * 保存书签到存储
   */
  private saveToStorage(): void {
    if (this.storage.saveBookmarks) {
      this.storage.saveBookmarks({
        bookmarks: this.bookmarks,
        timestamp: Date.now(),
      })
    }
  }

  /**
   * 销毁书签管理器
   */
  destroy(): void {
    this.bookmarks = []
  }
}

/**
 * 创建书签管理器
 * 
 * @param tabManager - 标签管理器实例
 * @param storage - 存储适配器实例
 * @returns 书签管理器实例
 * 
 * @example
 * ```typescript
 * const bookmarkManager = createBookmarkManager(tabManager, storage)
 * ```
 */
export function createBookmarkManager(tabManager: TabManager, storage: TabStorage): BookmarkManager {
  return new BookmarkManager(tabManager, storage)
}


