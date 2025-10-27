/**
 * 事件发射器
 * 
 * 用于标签页系统的事件管理，实现发布-订阅模式。
 * 允许组件订阅标签页的各种变更事件并做出响应。
 * 
 * 主要特性：
 * - 支持多个监听器订阅同一事件
 * - 支持一次性监听（once）
 * - 自动管理监听器的生命周期
 * - 错误隔离（单个监听器错误不影响其他监听器）
 * 
 * @example
 * ```typescript
 * const emitter = new EventEmitter()
 * 
 * // 订阅事件
 * const unsubscribe = emitter.on('tab:add', (event) => {
 *   console.log('新标签:', event.tab)
 * })
 * 
 * // 发射事件
 * emitter.emit({
 *   type: 'tab:add',
 *   timestamp: Date.now(),
 *   tab: newTab
 * })
 * 
 * // 取消订阅
 * unsubscribe()
 * ```
 */

import type { TabEvent } from '../types/events'

export class EventEmitter {
  /** 事件监听器映射表：事件类型 -> 监听器集合 */
  private listeners: Map<string, Set<(event: TabEvent) => void>>

  /**
   * 构造函数
   * 初始化空的监听器映射表
   */
  constructor() {
    this.listeners = new Map()
  }

  /**
   * 监听事件
   * 
   * 订阅指定类型的事件。当事件触发时，监听器函数会被调用。
   * 可以对同一事件添加多个监听器，它们会按添加顺序依次执行。
   * 
   * @param type - 事件类型（如 'tab:add', 'tab:remove' 等）
   * @param listener - 事件监听器函数
   * @returns 取消监听的函数，调用后会移除该监听器
   * 
   * @example
   * ```typescript
   * // 添加监听器
   * const unsubscribe = emitter.on('tab:add', (event) => {
   *   console.log('标签已添加:', event.tab.title)
   * })
   * 
   * // 稍后取消监听
   * unsubscribe()
   * ```
   */
  on(type: string, listener: (event: TabEvent) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(listener)

    // 返回取消监听函数
    return () => this.off(type, listener)
  }

  /**
   * 监听一次事件
   * 
   * 订阅指定类型的事件，但监听器只会被触发一次，触发后自动移除。
   * 适用于只需要响应一次的场景，如等待初始化完成、等待首次数据加载等。
   * 
   * @param type - 事件类型
   * @param listener - 事件监听器函数（只会执行一次）
   * @returns 取消监听的函数（如果在触发前取消）
   * 
   * @example
   * ```typescript
   * // 只在第一次标签添加时执行
   * emitter.once('tab:add', (event) => {
   *   console.log('首个标签已添加:', event.tab.title)
   * })
   * 
   * // 等待状态恢复完成
   * emitter.once('tabs:restored', (event) => {
   *   console.log('标签状态已从存储恢复')
   * })
   * ```
   */
  once(type: string, listener: (event: TabEvent) => void): () => void {
    const wrappedListener = (event: TabEvent) => {
      listener(event)
      this.off(type, wrappedListener)
    }
    return this.on(type, wrappedListener)
  }

  /**
   * 取消监听
   * 
   * 移除指定的事件监听器。如果该事件类型没有剩余监听器，会自动清理映射表。
   * 
   * @param type - 事件类型
   * @param listener - 要移除的监听器函数（必须是之前添加的同一个函数引用）
   * 
   * @example
   * ```typescript
   * const listener = (event) => { console.log(event) }
   * 
   * // 添加监听器
   * emitter.on('tab:add', listener)
   * 
   * // 移除监听器
   * emitter.off('tab:add', listener)
   * ```
   */
  off(type: string, listener: (event: TabEvent) => void): void {
    const listeners = this.listeners.get(type)
    if (listeners) {
      listeners.delete(listener)
      // 如果该事件类型已没有监听器，删除映射条目以节省内存
      if (listeners.size === 0) {
        this.listeners.delete(type)
      }
    }
  }

  /**
   * 发射事件
   * 
   * 触发指定类型的事件，调用所有已注册的监听器。
   * 监听器按添加顺序依次执行。如果某个监听器抛出错误，
   * 会捕获并打印错误信息，但不会中断其他监听器的执行。
   * 
   * @param event - 事件对象，必须包含 type 字段
   * 
   * @example
   * ```typescript
   * // 发射标签添加事件
   * emitter.emit({
   *   type: 'tab:add',
   *   timestamp: Date.now(),
   *   tab: {
   *     id: 'tab_1',
   *     title: '新标签',
   *     path: '/new'
   *   }
   * })
   * ```
   */
  emit(event: TabEvent): void {
    const listeners = this.listeners.get(event.type)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error(`Error in event listener for ${event.type}:`, error)
        }
      })
    }
  }

  /**
   * 清除所有监听器
   * 
   * 移除所有事件类型的所有监听器，清空整个监听器映射表。
   * 通常在组件销毁或重置时调用，以防止内存泄漏。
   * 
   * @example
   * ```typescript
   * // 在组件卸载时清除所有监听器
   * onUnmounted(() => {
   *   emitter.clear()
   * })
   * ```
   */
  clear(): void {
    this.listeners.clear()
  }

  /**
   * 移除指定事件类型的所有监听器
   * 
   * 只清除特定事件类型的监听器，不影响其他事件。
   * 适用于需要重置某个事件的所有订阅的场景。
   * 
   * @param type - 事件类型
   * 
   * @example
   * ```typescript
   * // 清除所有 tab:add 事件的监听器
   * emitter.removeAllListeners('tab:add')
   * ```
   */
  removeAllListeners(type: string): void {
    this.listeners.delete(type)
  }

  /**
   * 获取所有监听器（用于调试）
   * 
   * 返回当前所有事件及其监听器数量的映射。
   * 主要用于调试和监控内存使用情况。
   * 
   * @returns 事件类型到监听器数量的映射
   * 
   * @example
   * ```typescript
   * const listenersMap = emitter.getAllListeners()
   * console.log('当前监听器状态:', listenersMap)
   * // 输出: { 'tab:add': 3, 'tab:remove': 2 }
   * ```
   */
  getAllListeners(): Record<string, number> {
    const result: Record<string, number> = {}
    this.listeners.forEach((listeners, type) => {
      result[type] = listeners.size
    })
    return result
  }

  /**
   * 获取某个事件的监听器数量
   * 
   * 查询指定事件类型当前有多少个监听器。
   * 可用于调试或监控监听器的注册情况。
   * 
   * @param type - 事件类型
   * @returns 监听器数量，如果事件类型不存在则返回 0
   * 
   * @example
   * ```typescript
   * const count = emitter.listenerCount('tab:add')
   * console.log(`'tab:add' 事件有 ${count} 个监听器`)
   * ```
   */
  listenerCount(type: string): number {
    const listeners = this.listeners.get(type)
    return listeners ? listeners.size : 0
  }

  /**
   * 获取所有事件类型
   * 
   * 返回当前已注册监听器的所有事件类型列表。
   * 可用于调试或查看系统中正在监听哪些事件。
   * 
   * @returns 事件类型数组
   * 
   * @example
   * ```typescript
   * const types = emitter.eventTypes()
   * console.log('当前监听的事件:', types)
   * // 输出: ['tab:add', 'tab:remove', 'tab:activate']
   * ```
   */
  eventTypes(): string[] {
    return Array.from(this.listeners.keys())
  }
}


