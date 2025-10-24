/**
 * 事件发射器
 * 用于标签页系统的事件管理
 */

import type { TabEvent } from '../types/events'

export class EventEmitter {
  private listeners: Map<string, Set<(event: TabEvent) => void>>

  constructor() {
    this.listeners = new Map()
  }

  /**
   * 监听事件
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
   */
  off(type: string, listener: (event: TabEvent) => void): void {
    const listeners = this.listeners.get(type)
    if (listeners) {
      listeners.delete(listener)
      if (listeners.size === 0) {
        this.listeners.delete(type)
      }
    }
  }

  /**
   * 发射事件
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
   */
  clear(): void {
    this.listeners.clear()
  }

  /**
   * 获取某个事件的监听器数量
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
}


