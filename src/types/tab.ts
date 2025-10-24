/**
 * 标签页类型定义
 */

/**
 * 标签状态
 */
export type TabStatus = 'active' | 'loading' | 'error' | 'normal'

/**
 * 标签页接口
 */
export interface Tab {
  /** 唯一标识 */
  id: string
  /** 标题 */
  title: string
  /** 路由路径 */
  path: string
  /** 图标 */
  icon?: string
  /** 是否固定 */
  pinned: boolean
  /** 是否可关闭 */
  closable: boolean
  /** 状态 */
  status: TabStatus
  /** 元数据 */
  meta?: Record<string, any>
  /** 创建时间 */
  createdAt: number
  /** 最后访问时间 */
  lastAccessedAt: number
  /** 访问次数 */
  visitCount: number
}

/**
 * 创建标签页的配置
 */
export interface TabConfig {
  /** 唯一标识（可选，不提供时自动生成） */
  id?: string
  /** 标题 */
  title: string
  /** 路由路径 */
  path: string
  /** 图标 */
  icon?: string
  /** 是否固定 */
  pinned?: boolean
  /** 是否可关闭 */
  closable?: boolean
  /** 元数据 */
  meta?: Record<string, any>
}

/**
 * 标签组
 */
export interface TabGroup {
  /** 组ID */
  id: string
  /** 组名称 */
  name: string
  /** 是否折叠 */
  collapsed: boolean
  /** 标签列表 */
  tabs: Tab[]
  /** 创建时间 */
  createdAt: number
}

/**
 * 标签模板
 */
export interface TabTemplate {
  /** 模板ID */
  id: string
  /** 模板名称 */
  name: string
  /** 模板描述 */
  description?: string
  /** 标签配置列表 */
  tabs: TabConfig[]
  /** 创建时间 */
  createdAt: number
}

/**
 * 关闭的标签历史记录
 */
export interface ClosedTabHistory {
  /** 标签信息 */
  tab: Tab
  /** 关闭时间 */
  closedAt: number
  /** 关闭时的索引位置 */
  index: number
}


