/**
 * 事件类型定义
 */

import type { Tab, TabGroup, TabTemplate } from './tab'

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
  | 'group:create'
  | 'group:update'
  | 'group:delete'
  | 'group:add-tab'
  | 'group:remove-tab'
  | 'group:toggle'
  | 'group:close'
  | 'group:move'
  | 'template:save'
  | 'template:load'
  | 'template:update'
  | 'template:delete'
  | 'template:import'
  | 'template:import-batch'
  | 'template:clear-all'
  | 'batch:mode-enabled'
  | 'batch:mode-disabled'
  | 'batch:close'
  | 'batch:pin'
  | 'batch:unpin'
  | 'batch:add-to-group'
  | 'batch:save-as-template'
  | 'bookmark:add'
  | 'bookmark:update'
  | 'bookmark:delete'
  | 'bookmark:open'
  | 'bookmark:import'
  | 'bookmark:clear-all'

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
 * 分组创建事件
 */
export interface GroupCreateEvent extends TabEventData {
  type: 'group:create'
  /** 创建的分组 */
  group: TabGroup
}

/**
 * 分组更新事件
 */
export interface GroupUpdateEvent extends TabEventData {
  type: 'group:update'
  /** 更新后的分组 */
  group: TabGroup
  /** 更新前的分组 */
  oldGroup: TabGroup
}

/**
 * 分组删除事件
 */
export interface GroupDeleteEvent extends TabEventData {
  type: 'group:delete'
  /** 删除的分组 */
  group: TabGroup
}

/**
 * 分组标签操作事件
 */
export interface GroupTabOperationEvent extends TabEventData {
  type: 'group:add-tab' | 'group:remove-tab'
  /** 分组ID */
  groupId: string
  /** 标签ID列表 */
  tabIds: string[]
}

/**
 * 分组切换事件
 */
export interface GroupToggleEvent extends TabEventData {
  type: 'group:toggle'
  /** 分组ID */
  groupId: string
  /** 折叠状态 */
  collapsed: boolean
}

/**
 * 分组关闭事件
 */
export interface GroupCloseEvent extends TabEventData {
  type: 'group:close'
  /** 分组ID */
  groupId: string
  /** 关闭的标签数量 */
  closedCount: number
}

/**
 * 分组移动事件
 */
export interface GroupMoveEvent extends TabEventData {
  type: 'group:move'
  /** 分组ID */
  groupId: string
  /** 原索引 */
  fromIndex: number
  /** 目标索引 */
  toIndex: number
}

/**
 * 模板保存事件
 */
export interface TemplateSaveEvent extends TabEventData {
  type: 'template:save'
  /** 保存的模板 */
  template: TabTemplate
}

/**
 * 模板加载事件
 */
export interface TemplateLoadEvent extends TabEventData {
  type: 'template:load'
  /** 加载的模板 */
  template: TabTemplate
}

/**
 * 模板更新事件
 */
export interface TemplateUpdateEvent extends TabEventData {
  type: 'template:update'
  /** 更新后的模板 */
  template: TabTemplate
  /** 更新前的模板 */
  oldTemplate: TabTemplate
}

/**
 * 模板删除事件
 */
export interface TemplateDeleteEvent extends TabEventData {
  type: 'template:delete'
  /** 删除的模板 */
  template: TabTemplate
}

/**
 * 模板导入事件
 */
export interface TemplateImportEvent extends TabEventData {
  type: 'template:import'
  /** 导入的模板 */
  template: TabTemplate
}

/**
 * 模板批量导入事件
 */
export interface TemplateImportBatchEvent extends TabEventData {
  type: 'template:import-batch'
  /** 导入的模板数量 */
  count: number
}

/**
 * 模板清空事件
 */
export interface TemplateClearAllEvent extends TabEventData {
  type: 'template:clear-all'
}

/**
 * 批量模式启用事件
 */
export interface BatchModeEnabledEvent extends TabEventData {
  type: 'batch:mode-enabled'
}

/**
 * 批量模式禁用事件
 */
export interface BatchModeDisabledEvent extends TabEventData {
  type: 'batch:mode-disabled'
}

/**
 * 批量关闭事件
 */
export interface BatchCloseEvent extends TabEventData {
  type: 'batch:close'
  /** 关闭的标签数量 */
  closedCount: number
}

/**
 * 批量固定事件
 */
export interface BatchPinEvent extends TabEventData {
  type: 'batch:pin'
  /** 固定的标签数量 */
  pinnedCount: number
}

/**
 * 批量取消固定事件
 */
export interface BatchUnpinEvent extends TabEventData {
  type: 'batch:unpin'
  /** 取消固定的标签数量 */
  unpinnedCount: number
}

/**
 * 批量添加到分组事件
 */
export interface BatchAddToGroupEvent extends TabEventData {
  type: 'batch:add-to-group'
  /** 分组ID */
  groupId: string
  /** 标签ID列表 */
  tabIds: string[]
}

/**
 * 批量保存为模板事件
 */
export interface BatchSaveAsTemplateEvent extends TabEventData {
  type: 'batch:save-as-template'
  /** 模板名称 */
  name: string
  /** 模板描述 */
  description?: string
  /** 标签数量 */
  tabCount: number
}

/**
 * 书签添加事件
 */
export interface BookmarkAddEvent extends TabEventData {
  type: 'bookmark:add'
  /** 书签对象 */
  bookmark: any  // Bookmark type from bookmark-manager
}

/**
 * 书签更新事件
 */
export interface BookmarkUpdateEvent extends TabEventData {
  type: 'bookmark:update'
  /** 更新后的书签 */
  bookmark: any
  /** 更新前的书签 */
  oldBookmark: any
}

/**
 * 书签删除事件
 */
export interface BookmarkDeleteEvent extends TabEventData {
  type: 'bookmark:delete'
  /** 删除的书签 */
  bookmark: any
}

/**
 * 书签打开事件
 */
export interface BookmarkOpenEvent extends TabEventData {
  type: 'bookmark:open'
  /** 打开的书签 */
  bookmark: any
}

/**
 * 书签导入事件
 */
export interface BookmarkImportEvent extends TabEventData {
  type: 'bookmark:import'
  /** 导入的书签数量 */
  count: number
}

/**
 * 书签清空事件
 */
export interface BookmarkClearAllEvent extends TabEventData {
  type: 'bookmark:clear-all'
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
  | GroupCreateEvent
  | GroupUpdateEvent
  | GroupDeleteEvent
  | GroupTabOperationEvent
  | GroupToggleEvent
  | GroupCloseEvent
  | GroupMoveEvent
  | TemplateSaveEvent
  | TemplateLoadEvent
  | TemplateUpdateEvent
  | TemplateDeleteEvent
  | TemplateImportEvent
  | TemplateImportBatchEvent
  | TemplateClearAllEvent
  | BatchModeEnabledEvent
  | BatchModeDisabledEvent
  | BatchCloseEvent
  | BatchPinEvent
  | BatchUnpinEvent
  | BatchAddToGroupEvent
  | BatchSaveAsTemplateEvent
  | BookmarkAddEvent
  | BookmarkUpdateEvent
  | BookmarkDeleteEvent
  | BookmarkOpenEvent
  | BookmarkImportEvent
  | BookmarkClearAllEvent

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


