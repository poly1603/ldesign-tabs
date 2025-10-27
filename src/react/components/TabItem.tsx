/**
 * React 组件 - TabItem
 * 
 * 单个标签页组件，支持拖拽、关闭、图标等功能。
 * 
 * @example
 * ```tsx
 * <TabItem
 *   tab={tab}
 *   index={0}
 *   isActive={activeTabId === tab.id}
 *   onClick={() => handleTabClick(tab)}
 *   onClose={() => handleTabClose(tab)}
 * />
 * ```
 */

import React, { memo } from 'react'
import type { Tab } from '../../types'

/**
 * TabItem Props
 */
export interface TabItemProps {
  /** 标签对象 */
  tab: Tab
  /** 标签索引 */
  index: number
  /** 是否激活 */
  isActive?: boolean
  /** 是否正在拖拽 */
  isDragging?: boolean
  /** 是否显示图标 */
  showIcon?: boolean
  /** 是否启用拖拽 */
  enableDrag?: boolean
  /** 点击事件 */
  onClick?: (tab: Tab) => void
  /** 关闭事件 */
  onClose?: (tab: Tab) => void
  /** 右键菜单事件 */
  onContextMenu?: (event: React.MouseEvent, tab: Tab) => void
  /** 拖拽事件 */
  onDragStart?: (event: React.DragEvent, index: number) => void
  onDragEnd?: (event: React.DragEvent) => void
  onDragOver?: (event: React.DragEvent, index: number) => void
  onDragEnter?: (event: React.DragEvent, index: number) => void
  onDrop?: (event: React.DragEvent, index: number) => void
  /** 自定义类名 */
  className?: string
}

/**
 * TabItem 组件
 */
export const TabItem = memo<TabItemProps>(({
  tab,
  index,
  isActive = false,
  isDragging = false,
  showIcon = true,
  enableDrag = true,
  onClick,
  onClose,
  onContextMenu,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragEnter,
  onDrop,
  className = '',
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick?.(tab)
  }

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose?.(tab)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onContextMenu?.(e, tab)
  }

  const classNames = [
    'ld-tab-item',
    isActive && 'active',
    isDragging && 'dragging',
    tab.pinned && 'pinned',
    tab.status && `status-${tab.status}`,
    className,
  ].filter(Boolean).join(' ')

  return (
    <div
      className={classNames}
      draggable={enableDrag}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onDragStart={(e) => onDragStart?.(e, index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver?.(e, index)}
      onDragEnter={(e) => onDragEnter?.(e, index)}
      onDrop={(e) => onDrop?.(e, index)}
      data-tab-id={tab.id}
      data-tab-index={index}
    >
      {/* 图标 */}
      {showIcon && tab.icon && (
        <span className="ld-tab-icon">{tab.icon}</span>
      )}

      {/* 标题 */}
      <span className="ld-tab-title">{tab.title}</span>

      {/* 关闭按钮 */}
      {tab.closable && (
        <button
          className="ld-tab-close"
          onClick={handleClose}
          aria-label="关闭标签"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor">
            <path d="M4 4L12 12M12 4L4 12" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {/* 分隔线 */}
      <span className="ld-tab-separator" />
    </div>
  )
})

TabItem.displayName = 'TabItem'


