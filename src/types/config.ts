/**
 * 配置类型定义
 */

import type { Tab, TabConfig } from './tab'

/**
 * 标签页管理器配置
 */
export interface TabManagerConfig {
  /** 最大标签数量 */
  maxTabs?: number
  /** 是否启用持久化 */
  persist?: boolean
  /** 持久化存储的 key */
  persistKey?: string
  /** 默认标签（应用启动时打开） */
  defaultTabs?: TabConfig[]
  /** 是否自动激活新标签 */
  autoActivate?: boolean
}

/**
 * 路由集成配置
 */
export interface RouterConfig {
  /** 是否自动同步路由 */
  autoSync?: boolean
  /** 自定义获取标签标题 */
  getTabTitle?: (route: any) => string
  /** 自定义获取标签图标 */
  getTabIcon?: (route: any) => string | undefined
  /** 判断是否应该创建标签 */
  shouldCreateTab?: (route: any) => boolean
  /** 判断是否应该固定标签 */
  shouldPinTab?: (route: any) => boolean
}

/**
 * 拖拽配置
 */
export interface DragConfig {
  /** 是否启用拖拽 */
  enabled?: boolean
  /** 拖拽延迟（ms） */
  delay?: number
  /** 拖拽距离阈值 */
  distance?: number
}

/**
 * 快捷键配置
 */
export interface ShortcutConfig {
  /** 是否启用快捷键 */
  enabled?: boolean
  /** 关闭当前标签 */
  closeTab?: string
  /** 切换到下一个标签 */
  nextTab?: string
  /** 切换到上一个标签 */
  prevTab?: string
  /** 重新打开最近关闭的标签 */
  reopenTab?: string
  /** 打开搜索 */
  search?: string
}

/**
 * 样式类型
 */
export type TabStyleType = 'chrome' | 'vscode' | 'card' | 'material'

/**
 * 宽度适应模式
 */
export type TabWidthMode = 'shrink' | 'scroll'

/**
 * 尺寸大小
 */
export type TabSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * 样式配置
 */
export interface StyleConfig {
  /** 标签最大宽度 */
  maxWidth?: number
  /** 标签最小宽度 */
  minWidth?: number
  /** 是否显示图标 */
  showIcon?: boolean
  /** 关闭按钮位置 */
  closeButtonPosition?: 'left' | 'right'
  /** 标签风格 */
  style?: 'chrome' | 'edge' | 'safari' | 'custom'
  /** 样式类型（新） */
  styleType?: TabStyleType
  /** 宽度适应模式 */
  widthMode?: TabWidthMode
  /** 尺寸大小 */
  size?: TabSize
}

/**
 * 完整配置
 */
export interface TabsConfig extends TabManagerConfig {
  /** 路由配置 */
  router?: RouterConfig
  /** 拖拽配置 */
  drag?: DragConfig
  /** 快捷键配置 */
  shortcuts?: ShortcutConfig
  /** 样式配置 */
  style?: StyleConfig
  /** 历史记录最大数量 */
  maxHistory?: number
  /** 是否启用搜索 */
  enableSearch?: boolean
  /** 是否启用分组 */
  enableGroups?: boolean
  /** 是否启用模板 */
  enableTemplates?: boolean
}


