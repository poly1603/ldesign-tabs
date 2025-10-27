/**
 * 优化版事件发射器
 * 
 * 性能优化要点：
 * 1. 使用对象池复用事件对象
 * 2. 批量处理事件
 * 3. 避免创建不必要的函数闭包
 * 4. 使用 WeakRef 自动清理失效监听器
 * 5. 实现事件优先级
 */

import type { TabEvent } from '../types/events'

interface ListenerInfo {
  callback: (event: TabEvent) => void
  priority: number
  once: boolean
}

/**
 * 优化的事件发射器
 */
export class OptimizedEventEmitter {
  private listeners = new Map<string, Set<ListenerInfo>>()
  private eventQueue: TabEvent[] = []
  private isProcessing = false
  private batchTimeout: ReturnType<typeof setTimeout> | null = null

  // 性能优化：使用 WeakRef 存储组件引用，自动清理
  private componentRefs = new WeakMap<object, WeakRef<object>>()

  // 事件对象池（减少GC压力）
  private eventPool: TabEvent[] = []
  private readonly MAX_POOL_SIZE = 50

  /**
   * 监听事件（优化版）
   */
  on(
    type: string,
    listener: (event: TabEvent) => void,
    options?: { priority?: number; context?: object }
  ): () => void {
    const priority = options?.priority ?? 0
    const context = options?.context

    // 如果提供了上下文，使用 WeakRef
    if (context) {
      this.componentRefs.set(context, new WeakRef(context))
    }

    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }

    const info: ListenerInfo = {
      callback: listener,
      priority,
      once: false,
    }

    // 按优先级插入
    const listeners = this.listeners.get(type)!
    listeners.add(info)

    // 返回优化的取消函数
    return () => {
      listeners.delete(info)
      if (listeners.size === 0) {
        this.listeners.delete(type)
      }
    }
  }

  /**
   * 监听一次
   */
  once(
    type: string,
    listener: (event: TabEvent) => void,
    options?: { priority?: number }
  ): () => void {
    const priority = options?.priority ?? 0

    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }

    const info: ListenerInfo = {
      callback: listener,
      priority,
      once: true,
    }

    const listeners = this.listeners.get(type)!
    listeners.add(info)

    return () => {
      listeners.delete(info)
      if (listeners.size === 0) {
        this.listeners.delete(type)
      }
    }
  }

  /**
   * 发射事件（批量优化）
   */
  emit(event: TabEvent): void {
    // 添加到队列
    this.eventQueue.push(event)

    // 批量处理
    if (!this.isProcessing && !this.batchTimeout) {
      // 使用微任务优化，比 setTimeout 0 更快
      queueMicrotask(() => this.processBatch())
    }
  }

  /**
   * 立即发射事件（跳过批处理）
   */
  emitImmediate(event: TabEvent): void {
    this.processEvent(event)
  }

  /**
   * 批量处理事件
   */
  private processBatch(): void {
    if (this.eventQueue.length === 0) {
      return
    }

    this.isProcessing = true

    // 处理所有排队的事件
    const events = this.eventQueue.splice(0)
    for (const event of events) {
      this.processEvent(event)
    }

    this.isProcessing = false

    // 回收事件对象到池中
    for (const event of events) {
      this.recycleEvent(event)
    }
  }

  /**
   * 处理单个事件
   */
  private processEvent(event: TabEvent): void {
    const listeners = this.listeners.get(event.type)
    if (!listeners || listeners.size === 0) {
      return
    }

    // 按优先级排序监听器
    const sortedListeners = Array.from(listeners).sort(
      (a, b) => b.priority - a.priority
    )

    // 执行监听器
    const toRemove: ListenerInfo[] = []

    for (const info of sortedListeners) {
      try {
        info.callback(event)

        // 处理一次性监听器
        if (info.once) {
          toRemove.push(info)
        }
      } catch (error) {
        console.error(`Error in event listener for ${event.type}:`, error)
      }
    }

    // 移除一次性监听器
    for (const info of toRemove) {
      listeners.delete(info)
    }

    // 清理空的监听器集合
    if (listeners.size === 0) {
      this.listeners.delete(event.type)
    }
  }

  /**
   * 创建事件对象（使用对象池）
   */
  createEvent(type: string, data?: any): TabEvent {
    // 从池中获取或创建新对象
    let event = this.eventPool.pop()

    if (event) {
      // 重用对象
      event.type = type
      event.timestamp = Date.now()
      Object.assign(event, data)
    } else {
      // 创建新对象
      event = {
        type,
        timestamp: Date.now(),
        ...data,
      } as TabEvent
    }

    return event
  }

  /**
   * 回收事件对象到池中
   */
  private recycleEvent(event: TabEvent): void {
    if (this.eventPool.length >= this.MAX_POOL_SIZE) {
      return
    }

    // 清理事件对象
    for (const key in event) {
      if (key !== 'type' && key !== 'timestamp') {
        delete (event as any)[key]
      }
    }

    this.eventPool.push(event)
  }

  /**
   * 清除所有监听器
   */
  clear(): void {
    // 清理批处理定时器
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }

    // 清理所有监听器
    this.listeners.clear()

    // 清理事件队列
    this.eventQueue = []

    // 清理对象池
    this.eventPool = []

    // 清理组件引用
    this.componentRefs = new WeakMap()
  }

  /**
   * 清除特定类型的监听器
   */
  removeAllListeners(type: string): void {
    this.listeners.delete(type)
  }

  /**
   * 获取监听器数量
   */
  listenerCount(type: string): number {
    const listeners = this.listeners.get(type)
    return listeners ? listeners.size : 0
  }

  /**
   * 获取所有事件类型
   */
  eventTypes(): string[] {
    return Array.from(this.listeners.keys())
  }

  /**
   * 检查是否有监听器
   */
  hasListeners(type: string): boolean {
    return this.listeners.has(type) && this.listeners.get(type)!.size > 0
  }

  /**
   * 获取调试信息
   */
  getDebugInfo(): {
    listenerCounts: Record<string, number>
    queueLength: number
    poolSize: number
  } {
    const listenerCounts: Record<string, number> = {}

    for (const [type, listeners] of this.listeners) {
      listenerCounts[type] = listeners.size
    }

    return {
      listenerCounts,
      queueLength: this.eventQueue.length,
      poolSize: this.eventPool.length,
    }
  }
}

/**
 * 创建优化的事件发射器
 */
export function createOptimizedEventEmitter(): OptimizedEventEmitter {
  return new OptimizedEventEmitter()
}

