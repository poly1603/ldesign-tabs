/**
 * 事件类型定义
 */

import type { Tab } from './tab'

/**
 * 事件类型
 */
export type TabEventType =
  | 'tab:add'
  | 'tab:remove'
  | 'tab:update'
  | 'tab:activate'
  | 'tab:pin'
  | 'tab:unpin'
  | 'tab:reorder'
  | 'tab:close-others'
  | 'tab:close-all'
  | 'tab:close-left'
  | 'tab:close-right'
  | 'tab:status-change'
  | 'tabs:limit-reached'
  | 'tabs:restored'

/**
 * 事件数据基类
 */
export interface TabEventData {
  /** 事件类型 */
  type: TabEventType
  /** 时间戳 */
  timestamp: number
}

/**
 * 标签添加事件
 */
export interface TabAddEvent extends TabEventData {
  type: 'tab:add'
  /** 新添加的标签 */
  tab: Tab
}

/**
 * 标签移除事件
 */
export interface TabRemoveEvent extends TabEventData {
  type: 'tab:remove'
  /** 被移除的标签 */
  tab: Tab
  /** 移除前的索引 */
  index: number
}

/**
 * 标签更新事件
 */
export interface TabUpdateEvent extends TabEventData {
  type: 'tab:update'
  /** 更新后的标签 */
  tab: Tab
  /** 更新的字段 */
  changes: Partial<Tab>
}

/**
 * 标签激活事件
 */
export interface TabActivateEvent extends TabEventData {
  type: 'tab:activate'
  /** 激活的标签 */
  tab: Tab
  /** 之前激活的标签 */
  previousTab?: Tab
}

/**
 * 标签固定事件
 */
export interface TabPinEvent extends TabEventData {
  type: 'tab:pin' | 'tab:unpin'
  /** 标签 */
  tab: Tab
}

/**
 * 标签重新排序事件
 */
export interface TabReorderEvent extends TabEventData {
  type: 'tab:reorder'
  /** 标签ID */
  tabId: string
  /** 原索引 */
  fromIndex: number
  /** 目标索引 */
  toIndex: number
}

/**
 * 标签状态变化事件
 */
export interface TabStatusChangeEvent extends TabEventData {
  type: 'tab:status-change'
  /** 标签 */
  tab: Tab
  /** 旧状态 */
  oldStatus: Tab['status']
  /** 新状态 */
  newStatus: Tab['status']
}

/**
 * 批量关闭事件
 */
export interface TabBatchCloseEvent extends TabEventData {
  type: 'tab:close-others' | 'tab:close-all' | 'tab:close-left' | 'tab:close-right'
  /** 关闭的标签列表 */
  closedTabs: Tab[]
  /** 保留的标签（close-others 时） */
  keptTab?: Tab
}

/**
 * 标签数量限制事件
 */
export interface TabsLimitReachedEvent extends TabEventData {
  type: 'tabs:limit-reached'
  /** 当前标签数量 */
  count: number
  /** 最大限制 */
  limit: number
}

/**
 * 标签恢复事件
 */
export interface TabsRestoredEvent extends TabEventData {
  type: 'tabs:restored'
  /** 恢复的标签列表 */
  tabs: Tab[]
}

/**
 * 所有事件类型联合
 */
export type TabEvent =
  | TabAddEvent
  | TabRemoveEvent
  | TabUpdateEvent
  | TabActivateEvent
  | TabPinEvent
  | TabReorderEvent
  | TabStatusChangeEvent
  | TabBatchCloseEvent
  | TabsLimitReachedEvent
  | TabsRestoredEvent

/**
 * 事件监听器
 */
export type TabEventListener<T extends TabEvent = TabEvent> = (event: T) => void

/**
 * 事件发射器接口
 */
export interface TabEventEmitter {
  /** 监听事件 */
  on<T extends TabEvent>(type: T['type'], listener: TabEventListener<T>): () => void
  /** 监听一次事件 */
  once<T extends TabEvent>(type: T['type'], listener: TabEventListener<T>): () => void
  /** 取消监听 */
  off<T extends TabEvent>(type: T['type'], listener: TabEventListener<T>): void
  /** 发射事件 */
  emit<T extends TabEvent>(event: T): void
  /** 清除所有监听器 */
  clear(): void
}


