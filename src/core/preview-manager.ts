/**
 * 标签预览管理器
 * 
 * 提供标签页缩略图预览功能，提升用户体验。
 * 支持缩略图生成、缓存、延迟加载等功能。
 * 
 * 主要功能：
 * - 缩略图自动生成
 * - IndexedDB 缓存机制
 * - 延迟加载（防止频繁触发）
 * - 预览位置智能调整
 * - 缓存过期管理
 * 
 * @example
 * ```typescript
 * const previewManager = new PreviewManager({
 *   cacheExpiry: 5 * 60 * 1000, // 5分钟
 *   delayShow: 500 // 悬停500ms后显示
 * })
 * 
 * // 生成预览
 * const preview = await previewManager.generatePreview('tab_123', element)
 * 
 * // 显示预览
 * previewManager.showPreview('tab_123', { x: 100, y: 200 })
 * ```
 */

import type { Tab } from '../types'

/**
 * 预览配置
 */
export interface PreviewConfig {
  /** 缓存过期时间（毫秒，默认5分钟） */
  cacheExpiry?: number
  /** 延迟显示时间（毫秒，默认500ms） */
  delayShow?: number
  /** 缩略图宽度（像素，默认300） */
  thumbnailWidth?: number
  /** 缩略图高度（像素，默认200） */
  thumbnailHeight?: number
  /** 缩略图质量（0-1，默认0.8） */
  quality?: number
  /** 是否启用 IndexedDB 缓存（默认true） */
  enableCache?: boolean
}

/**
 * 预览数据
 */
export interface PreviewData {
  /** 标签ID */
  tabId: string
  /** 缩略图数据URL */
  dataUrl: string
  /** 生成时间 */
  timestamp: number
  /** 宽度 */
  width: number
  /** 高度 */
  height: number
}

/**
 * 预览位置
 */
export interface PreviewPosition {
  /** X坐标 */
  x: number
  /** Y坐标 */
  y: number
  /** 对齐方式 */
  align?: 'top' | 'bottom' | 'left' | 'right'
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Required<PreviewConfig> = {
  cacheExpiry: 5 * 60 * 1000, // 5分钟
  delayShow: 500, // 500毫秒
  thumbnailWidth: 300,
  thumbnailHeight: 200,
  quality: 0.8,
  enableCache: true,
}

/**
 * 预览管理器类
 */
export class PreviewManager {
  /** 配置 */
  private config: Required<PreviewConfig>

  /** 内存缓存 */
  private memoryCache: Map<string, PreviewData> = new Map()

  /** IndexedDB 数据库名称 */
  private readonly DB_NAME = 'ldesign_tabs_preview'
  private readonly DB_VERSION = 1
  private readonly STORE_NAME = 'previews'

  /** 数据库实例 */
  private db: IDBDatabase | null = null

  /** 延迟定时器 */
  private showTimer: ReturnType<typeof setTimeout> | null = null

  /** 当前显示的预览元素 */
  private previewElement: HTMLElement | null = null

  /**
   * 构造函数
   * 
   * @param config - 预览配置
   * 
   * @example
   * ```typescript
   * const previewManager = new PreviewManager({
   *   cacheExpiry: 10 * 60 * 1000, // 10分钟
   *   delayShow: 300,
   *   thumbnailWidth: 400
   * })
   * ```
   */
  constructor(config: PreviewConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }

    if (this.config.enableCache && typeof indexedDB !== 'undefined') {
      this.initDatabase()
    }
  }

  /**
   * 初始化 IndexedDB 数据库
   * 
   * 内部方法：创建或打开 IndexedDB 数据库用于缓存缩略图。
   */
  private async initDatabase(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      return
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建对象存储
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'tabId' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  /**
   * 生成标签预览
   * 
   * 使用 Canvas API 生成标签内容的缩略图。
   * 由于浏览器安全限制，实际应用中可能需要服务端渲染或截图API。
   * 
   * @param tabId - 标签ID
   * @param element - 要预览的DOM元素（可选）
   * @returns 预览数据，失败返回null
   * 
   * @example
   * ```typescript
   * // 生成当前激活标签的预览
   * const element = document.querySelector('.tab-content')
   * const preview = await previewManager.generatePreview('tab_123', element)
   * 
   * if (preview) {
   *   console.log('预览已生成')
   * }
   * ```
   */
  async generatePreview(tabId: string, element?: HTMLElement): Promise<PreviewData | null> {
    try {
      // 检查缓存
      const cached = await this.getFromCache(tabId)
      if (cached && !this.isCacheExpired(cached)) {
        return cached
      }

      if (!element) {
        return null
      }

      // 使用 html2canvas 或类似库生成缩略图
      // 注意：这里使用占位实现，实际需要引入 html2canvas
      const dataUrl = await this.captureElement(element)

      const previewData: PreviewData = {
        tabId,
        dataUrl,
        timestamp: Date.now(),
        width: this.config.thumbnailWidth,
        height: this.config.thumbnailHeight,
      }

      // 保存到缓存
      await this.saveToCache(previewData)

      return previewData
    }
    catch (error) {
      console.error('Failed to generate preview:', error)
      return null
    }
  }

  /**
   * 捕获元素为图片
   * 
   * 内部方法：将DOM元素转换为图片数据。
   * 
   * 注意：实际实现需要使用 html2canvas 或浏览器的截图 API。
   * 这里提供占位实现。
   */
  private async captureElement(element: HTMLElement): Promise<string> {
    // 占位实现：创建一个简单的 Canvas
    const canvas = document.createElement('canvas')
    canvas.width = this.config.thumbnailWidth
    canvas.height = this.config.thumbnailHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }

    // 简单的占位图
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#999'
    ctx.font = '16px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('预览占位', canvas.width / 2, canvas.height / 2)

    // 实际实现应该使用：
    // import html2canvas from 'html2canvas'
    // const canvas = await html2canvas(element, {
    //   width: this.config.thumbnailWidth,
    //   height: this.config.thumbnailHeight,
    //   scale: 1
    // })

    return canvas.toDataURL('image/png', this.config.quality)
  }

  /**
   * 显示预览（带延迟）
   * 
   * 在指定位置显示标签预览。如果配置了延迟，会等待指定时间后再显示。
   * 
   * @param tabId - 标签ID
   * @param position - 显示位置
   * 
   * @example
   * ```typescript
   * // 鼠标悬停时显示预览
   * tabElement.addEventListener('mouseenter', (e) => {
   *   previewManager.showPreview('tab_123', {
   *     x: e.clientX,
   *     y: e.clientY,
   *     align: 'bottom'
   *   })
   * })
   * 
   * // 鼠标离开时隐藏
   * tabElement.addEventListener('mouseleave', () => {
   *   previewManager.hidePreview()
   * })
   * ```
   */
  showPreview(tabId: string, position: PreviewPosition): void {
    // 清除之前的定时器
    if (this.showTimer) {
      clearTimeout(this.showTimer)
    }

    // 延迟显示
    this.showTimer = setTimeout(async () => {
      const preview = await this.getFromCache(tabId)
      if (preview && !this.isCacheExpired(preview)) {
        this.renderPreview(preview, position)
      }
    }, this.config.delayShow)
  }

  /**
   * 隐藏预览
   * 
   * 立即隐藏当前显示的预览。
   * 
   * @example
   * ```typescript
   * previewManager.hidePreview()
   * ```
   */
  hidePreview(): void {
    // 清除定时器
    if (this.showTimer) {
      clearTimeout(this.showTimer)
      this.showTimer = null
    }

    // 移除预览元素
    if (this.previewElement && this.previewElement.parentNode) {
      this.previewElement.parentNode.removeChild(this.previewElement)
      this.previewElement = null
    }
  }

  /**
   * 渲染预览元素
   * 
   * 内部方法：在指定位置创建并显示预览元素。
   */
  private renderPreview(preview: PreviewData, position: PreviewPosition): void {
    // 移除旧的预览
    this.hidePreview()

    // 创建预览元素
    const previewEl = document.createElement('div')
    previewEl.className = 'ld-tab-preview'
    previewEl.style.position = 'fixed'
    previewEl.style.zIndex = '10000'
    previewEl.style.pointerEvents = 'none'
    previewEl.style.borderRadius = '8px'
    previewEl.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)'
    previewEl.style.overflow = 'hidden'
    previewEl.style.animation = 'ld-tabs-fade-in 0.2s ease'

    // 创建图片元素
    const img = document.createElement('img')
    img.src = preview.dataUrl
    img.style.display = 'block'
    img.style.width = `${preview.width}px`
    img.style.height = `${preview.height}px`

    previewEl.appendChild(img)

    // 计算位置（智能调整，避免超出视口）
    const { x, y } = this.calculatePosition(position, preview.width, preview.height)
    previewEl.style.left = `${x}px`
    previewEl.style.top = `${y}px`

    // 添加到 body
    document.body.appendChild(previewEl)
    this.previewElement = previewEl
  }

  /**
   * 计算预览位置
   * 
   * 内部方法：智能计算预览显示位置，确保不超出视口。
   */
  private calculatePosition(
    position: PreviewPosition,
    width: number,
    height: number
  ): { x: number; y: number } {
    let x = position.x
    let y = position.y

    const padding = 10
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // 根据对齐方式调整
    switch (position.align) {
      case 'top':
        y = y - height - padding
        break
      case 'bottom':
        y = y + padding
        break
      case 'left':
        x = x - width - padding
        break
      case 'right':
        x = x + padding
        break
      default:
        // 默认显示在下方
        y = y + padding
    }

    // 确保不超出右边界
    if (x + width > viewportWidth - padding) {
      x = viewportWidth - width - padding
    }

    // 确保不超出下边界
    if (y + height > viewportHeight - padding) {
      y = viewportHeight - height - padding
    }

    // 确保不超出左边界
    if (x < padding) {
      x = padding
    }

    // 确保不超出上边界
    if (y < padding) {
      y = padding
    }

    return { x, y }
  }

  /**
   * 从缓存获取预览
   * 
   * 优先从内存缓存获取，如果没有则从 IndexedDB 获取。
   * 
   * @param tabId - 标签ID
   * @returns 预览数据，未找到返回null
   */
  private async getFromCache(tabId: string): Promise<PreviewData | null> {
    // 先检查内存缓存
    const memCached = this.memoryCache.get(tabId)
    if (memCached && !this.isCacheExpired(memCached)) {
      return memCached
    }

    // 检查 IndexedDB
    if (!this.config.enableCache || !this.db) {
      return null
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly')
      const store = transaction.objectStore(this.STORE_NAME)
      const request = store.get(tabId)

      request.onsuccess = () => {
        const data = request.result as PreviewData | undefined
        if (data && !this.isCacheExpired(data)) {
          // 更新内存缓存
          this.memoryCache.set(tabId, data)
          resolve(data)
        } else {
          resolve(null)
        }
      }

      request.onerror = () => {
        resolve(null)
      }
    })
  }

  /**
   * 保存到缓存
   * 
   * 同时保存到内存缓存和 IndexedDB。
   * 
   * @param preview - 预览数据
   */
  private async saveToCache(preview: PreviewData): Promise<void> {
    // 保存到内存缓存
    this.memoryCache.set(preview.tabId, preview)

    // 保存到 IndexedDB
    if (!this.config.enableCache || !this.db) {
      return
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)
      const request = store.put(preview)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 检查缓存是否过期
   * 
   * @param preview - 预览数据
   * @returns 如果过期返回true
   */
  private isCacheExpired(preview: PreviewData): boolean {
    return Date.now() - preview.timestamp > this.config.cacheExpiry
  }

  /**
   * 清除指定标签的缓存
   * 
   * @param tabId - 标签ID
   * 
   * @example
   * ```typescript
   * // 标签内容更新后，清除旧的预览
   * previewManager.clearCache('tab_123')
   * ```
   */
  async clearCache(tabId: string): Promise<void> {
    // 清除内存缓存
    this.memoryCache.delete(tabId)

    // 清除 IndexedDB
    if (!this.config.enableCache || !this.db) {
      return
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)
      const request = store.delete(tabId)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 清除所有缓存
   * 
   * @example
   * ```typescript
   * previewManager.clearAllCache()
   * ```
   */
  async clearAllCache(): Promise<void> {
    // 清除内存缓存
    this.memoryCache.clear()

    // 清除 IndexedDB
    if (!this.config.enableCache || !this.db) {
      return
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 清除过期缓存
   * 
   * 清理所有超过过期时间的缓存项。
   * 建议定期调用以节省存储空间。
   * 
   * @returns 清除的数量
   * 
   * @example
   * ```typescript
   * // 每小时清理一次
   * setInterval(() => {
   *   previewManager.cleanExpiredCache()
   * }, 60 * 60 * 1000)
   * ```
   */
  async cleanExpiredCache(): Promise<number> {
    let count = 0

    // 清理内存缓存
    this.memoryCache.forEach((preview, tabId) => {
      if (this.isCacheExpired(preview)) {
        this.memoryCache.delete(tabId)
        count++
      }
    })

    // 清理 IndexedDB
    if (!this.config.enableCache || !this.db) {
      return count
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)
      const request = store.openCursor()
      let dbCount = 0

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue

        if (cursor) {
          const preview = cursor.value as PreviewData
          if (this.isCacheExpired(preview)) {
            cursor.delete()
            dbCount++
          }
          cursor.continue()
        } else {
          resolve(count + dbCount)
        }
      }

      request.onerror = () => {
        resolve(count)
      }
    })
  }

  /**
   * 获取缓存统计
   * 
   * @returns 缓存统计信息
   * 
   * @example
   * ```typescript
   * const stats = await previewManager.getCacheStats()
   * console.log(`内存缓存: ${stats.memoryCount} 个`)
   * console.log(`IndexedDB: ${stats.dbCount} 个`)
   * ```
   */
  async getCacheStats(): Promise<{
    memoryCount: number
    dbCount: number
    totalSize: number
  }> {
    const memoryCount = this.memoryCache.size

    let dbCount = 0
    let totalSize = 0

    if (this.config.enableCache && this.db) {
      await new Promise<void>((resolve) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readonly')
        const store = transaction.objectStore(this.STORE_NAME)
        const request = store.openCursor()

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result as IDBCursorWithValue

          if (cursor) {
            dbCount++
            totalSize += cursor.value.dataUrl.length
            cursor.continue()
          } else {
            resolve()
          }
        }

        request.onerror = () => resolve()
      })
    }

    return {
      memoryCount,
      dbCount,
      totalSize,
    }
  }

  /**
   * 销毁预览管理器
   * 
   * 清理所有资源，包括定时器、预览元素、数据库连接等。
   * 
   * @example
   * ```typescript
   * onUnmounted(() => {
   *   previewManager.destroy()
   * })
   * ```
   */
  destroy(): void {
    // 清除定时器
    if (this.showTimer) {
      clearTimeout(this.showTimer)
      this.showTimer = null
    }

    // 隐藏预览
    this.hidePreview()

    // 清除内存缓存
    this.memoryCache.clear()

    // 关闭数据库
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

/**
 * 创建预览管理器
 * 
 * @param config - 预览配置
 * @returns 预览管理器实例
 * 
 * @example
 * ```typescript
 * const previewManager = createPreviewManager({
 *   cacheExpiry: 10 * 60 * 1000,
 *   delayShow: 300,
 *   thumbnailWidth: 400,
 *   thumbnailHeight: 300
 * })
 * ```
 */
export function createPreviewManager(config?: PreviewConfig): PreviewManager {
  return new PreviewManager(config)
}

