/**
 * 性能监控工具
 * 
 * 用于监控标签系统的性能指标
 */

export interface PerformanceMetrics {
  // 时间指标
  renderTime: number
  updateTime: number
  searchTime: number

  // 内存指标
  memoryUsed: number
  memoryLimit: number
  memoryPercent: number

  // 标签指标
  totalTabs: number
  visibleTabs: number
  pinnedTabs: number

  // 事件指标
  eventQueueSize: number
  listenerCount: number

  // 缓存指标
  cacheHitRate: number
  indexSize: number
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    updateTime: 0,
    searchTime: 0,
    memoryUsed: 0,
    memoryLimit: 0,
    memoryPercent: 0,
    totalTabs: 0,
    visibleTabs: 0,
    pinnedTabs: 0,
    eventQueueSize: 0,
    listenerCount: 0,
    cacheHitRate: 0,
    indexSize: 0,
  }

  private timers = new Map<string, number>()
  private cacheHits = 0
  private cacheMisses = 0
  private enabled = true

  /**
   * 启用/禁用监控
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * 开始计时
   */
  startTimer(name: string): void {
    if (!this.enabled) return

    if (typeof performance !== 'undefined') {
      this.timers.set(name, performance.now())
    }
  }

  /**
   * 结束计时
   */
  endTimer(name: string): number {
    if (!this.enabled) return 0

    if (typeof performance !== 'undefined') {
      const start = this.timers.get(name)
      if (start !== undefined) {
        const duration = performance.now() - start
        this.timers.delete(name)

        // 更新相应的指标
        switch (name) {
          case 'render':
            this.metrics.renderTime = duration
            break
          case 'update':
            this.metrics.updateTime = duration
            break
          case 'search':
            this.metrics.searchTime = duration
            break
        }

        return duration
      }
    }

    return 0
  }

  /**
   * 记录缓存命中
   */
  recordCacheHit(): void {
    if (!this.enabled) return
    this.cacheHits++
    this.updateCacheHitRate()
  }

  /**
   * 记录缓存未命中
   */
  recordCacheMiss(): void {
    if (!this.enabled) return
    this.cacheMisses++
    this.updateCacheHitRate()
  }

  /**
   * 更新缓存命中率
   */
  private updateCacheHitRate(): void {
    const total = this.cacheHits + this.cacheMisses
    if (total > 0) {
      this.metrics.cacheHitRate = (this.cacheHits / total) * 100
    }
  }

  /**
   * 更新内存指标
   */
  updateMemoryMetrics(): void {
    if (!this.enabled) return

    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory
      this.metrics.memoryUsed = memory.usedJSHeapSize / 1024 / 1024 // MB
      this.metrics.memoryLimit = memory.jsHeapSizeLimit / 1024 / 1024 // MB
      this.metrics.memoryPercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    }
  }

  /**
   * 更新标签指标
   */
  updateTabMetrics(total: number, visible: number, pinned: number): void {
    if (!this.enabled) return

    this.metrics.totalTabs = total
    this.metrics.visibleTabs = visible
    this.metrics.pinnedTabs = pinned
  }

  /**
   * 更新事件指标
   */
  updateEventMetrics(queueSize: number, listenerCount: number): void {
    if (!this.enabled) return

    this.metrics.eventQueueSize = queueSize
    this.metrics.listenerCount = listenerCount
  }

  /**
   * 更新索引大小
   */
  updateIndexSize(size: number): void {
    if (!this.enabled) return
    this.metrics.indexSize = size
  }

  /**
   * 获取当前指标
   */
  getMetrics(): PerformanceMetrics {
    this.updateMemoryMetrics()
    return { ...this.metrics }
  }

  /**
   * 获取性能报告
   */
  getReport(): string {
    const metrics = this.getMetrics()

    return `
=== 性能报告 ===
时间指标:
  渲染时间: ${metrics.renderTime.toFixed(2)}ms
  更新时间: ${metrics.updateTime.toFixed(2)}ms
  搜索时间: ${metrics.searchTime.toFixed(2)}ms

内存指标:
  使用内存: ${metrics.memoryUsed.toFixed(2)}MB
  内存限制: ${metrics.memoryLimit.toFixed(2)}MB
  使用占比: ${metrics.memoryPercent.toFixed(1)}%

标签指标:
  总标签数: ${metrics.totalTabs}
  可见标签: ${metrics.visibleTabs}
  固定标签: ${metrics.pinnedTabs}

事件指标:
  事件队列: ${metrics.eventQueueSize}
  监听器数: ${metrics.listenerCount}

缓存指标:
  命中率: ${metrics.cacheHitRate.toFixed(1)}%
  索引大小: ${metrics.indexSize}
`
  }

  /**
   * 获取性能等级
   */
  getPerformanceLevel(): 'excellent' | 'good' | 'warning' | 'poor' {
    const metrics = this.getMetrics()

    // 评分规则
    let score = 100

    // 时间评分
    if (metrics.renderTime > 100) score -= 20
    else if (metrics.renderTime > 50) score -= 10

    if (metrics.updateTime > 50) score -= 20
    else if (metrics.updateTime > 20) score -= 10

    // 内存评分
    if (metrics.memoryPercent > 80) score -= 30
    else if (metrics.memoryPercent > 60) score -= 15

    // 缓存评分
    if (metrics.cacheHitRate < 50) score -= 20
    else if (metrics.cacheHitRate < 70) score -= 10

    // 返回等级
    if (score >= 80) return 'excellent'
    if (score >= 60) return 'good'
    if (score >= 40) return 'warning'
    return 'poor'
  }

  /**
   * 重置指标
   */
  reset(): void {
    this.metrics = {
      renderTime: 0,
      updateTime: 0,
      searchTime: 0,
      memoryUsed: 0,
      memoryLimit: 0,
      memoryPercent: 0,
      totalTabs: 0,
      visibleTabs: 0,
      pinnedTabs: 0,
      eventQueueSize: 0,
      listenerCount: 0,
      cacheHitRate: 0,
      indexSize: 0,
    }

    this.cacheHits = 0
    this.cacheMisses = 0
    this.timers.clear()
  }

  /**
   * 控制台输出
   */
  logToConsole(): void {
    if (!this.enabled) return

    const metrics = this.getMetrics()
    const level = this.getPerformanceLevel()
    const emoji = {
      excellent: '🚀',
      good: '✅',
      warning: '⚠️',
      poor: '❌',
    }[level]

    console.group(`${emoji} Tabs Performance [${level.toUpperCase()}]`)
    console.table({
      '渲染时间': `${metrics.renderTime.toFixed(2)}ms`,
      '更新时间': `${metrics.updateTime.toFixed(2)}ms`,
      '搜索时间': `${metrics.searchTime.toFixed(2)}ms`,
      '内存使用': `${metrics.memoryUsed.toFixed(2)}MB (${metrics.memoryPercent.toFixed(1)}%)`,
      '标签数量': `${metrics.totalTabs} (可见: ${metrics.visibleTabs})`,
      '缓存命中': `${metrics.cacheHitRate.toFixed(1)}%`,
    })
    console.groupEnd()
  }
}

/**
 * 创建性能监控器
 */
export function createPerformanceMonitor(): PerformanceMonitor {
  return new PerformanceMonitor()
}

/**
 * 全局性能监控器实例
 */
export const globalMonitor = createPerformanceMonitor()
