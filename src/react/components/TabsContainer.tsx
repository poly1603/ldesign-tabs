/**
 * React 组件 - TabsContainer
 * 
 * 标签页容器组件，提供完整的标签页功能。
 * 
 * @example
 * ```tsx
 * import { TabsContainer, useTabs } from '@ldesign/tabs/react'
 * 
 * function App() {
 *   const { tabs, activeTabId, activateTab, removeTab } = useTabs()
 * 
 *   return (
 *     <TabsContainer
 *       tabs={tabs}
 *       activeTabId={activeTabId}
 *       styleType="chrome"
 *       onTabClick={(tab) => activateTab(tab.id)}
 *       onTabClose={(tab) => removeTab(tab.id)}
 *     />
 *   )
 * }
 * ```
 */

import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import type { Tab, TabSize, TabStyleType, TabWidthMode } from '../../types'
import { TabItem } from './TabItem'

/**
 * TabsContainer Props
 */
export interface TabsContainerProps {
  /** 标签列表 */
  tabs?: Tab[]
  /** 当前激活的标签ID */
  activeTabId?: string | null
  /** 样式类型 */
  styleType?: TabStyleType
  /** 宽度模式 */
  widthMode?: TabWidthMode
  /** 尺寸 */
  size?: TabSize
  /** 是否启用拖拽 */
  enableDrag?: boolean
  /** 是否显示图标 */
  showIcon?: boolean
  /** 是否显示滚动按钮 */
  showScrollButtons?: boolean
  /** 是否显示新增按钮 */
  showAddButton?: boolean
  /** 自定义类名 */
  className?: string

  // 事件回调
  /** 标签点击 */
  onTabClick?: (tab: Tab) => void
  /** 标签关闭 */
  onTabClose?: (tab: Tab) => void
  /** 标签重新排序 */
  onTabReorder?: (fromIndex: number, toIndex: number) => void
  /** 右键菜单 */
  onContextMenu?: (event: React.MouseEvent, tab: Tab) => void
  /** 新增标签 */
  onAddTab?: () => void
}

/**
 * TabsContainer 组件
 */
export const TabsContainer = memo<TabsContainerProps>(({
  tabs = [],
  activeTabId = null,
  styleType = 'chrome',
  widthMode = 'scroll',
  size = 'md',
  enableDrag = true,
  showIcon = true,
  showScrollButtons = true,
  showAddButton = true,
  className = '',
  onTabClick,
  onTabClose,
  onTabReorder,
  onContextMenu,
  onAddTab,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [dragState, setDragState] = useState({ dragIndex: -1, dropIndex: -1 })

  // 更新滚动状态
  const updateScrollState = useCallback(() => {
    if (!listRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = listRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1)
  }, [])

  // 向左滚动
  const scrollLeft = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollBy({ left: -200, behavior: 'smooth' })
      setTimeout(updateScrollState, 300)
    }
  }, [updateScrollState])

  // 向右滚动
  const scrollRight = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollBy({ left: 200, behavior: 'smooth' })
      setTimeout(updateScrollState, 300)
    }
  }, [updateScrollState])

  // 拖拽处理
  const handleDragStart = useCallback((event: React.DragEvent, index: number) => {
    setDragState(prev => ({ ...prev, dragIndex: index }))
  }, [])

  const handleDragEnd = useCallback((event: React.DragEvent) => {
    if (dragState.dragIndex !== -1 && dragState.dropIndex !== -1) {
      onTabReorder?.(dragState.dragIndex, dragState.dropIndex)
    }
    setDragState({ dragIndex: -1, dropIndex: -1 })
  }, [dragState, onTabReorder])

  const handleDragOver = useCallback((event: React.DragEvent, index: number) => {
    event.preventDefault()
    setDragState(prev => ({ ...prev, dropIndex: index }))
  }, [])

  const handleDragEnter = useCallback((event: React.DragEvent, index: number) => {
    event.preventDefault()
    setDragState(prev => ({ ...prev, dropIndex: index }))
  }, [])

  const handleDrop = useCallback((event: React.DragEvent, index: number) => {
    event.preventDefault()
    event.stopPropagation()
    setDragState(prev => ({ ...prev, dropIndex: index }))
  }, [])

  // 滚轮横向滚动
  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (listRef.current && Math.abs(event.deltaY) > 0) {
      event.preventDefault()
      listRef.current.scrollLeft += event.deltaY
      requestAnimationFrame(updateScrollState)
    }
  }, [updateScrollState])

  // 初始化和清理
  useEffect(() => {
    updateScrollState()

    const handleResize = () => {
      requestAnimationFrame(updateScrollState)
    }

    window.addEventListener('resize', handleResize)
    const listElement = listRef.current
    if (listElement) {
      listElement.addEventListener('scroll', updateScrollState)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      if (listElement) {
        listElement.removeEventListener('scroll', updateScrollState)
      }
    }
  }, [updateScrollState])

  // 监听标签变化
  useEffect(() => {
    updateScrollState()
  }, [tabs.length, updateScrollState])

  const containerClass = [
    'ld-tabs-container',
    `ld-tabs-style-${styleType}`,
    `ld-tabs-width-${widthMode}`,
    `ld-tabs-size-${size}`,
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClass}>
      {/* 左滚动按钮 */}
      {showScrollButtons && canScrollLeft && (
        <button className="ld-tabs-scroll-btn" onClick={scrollLeft}>
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
          </svg>
        </button>
      )}

      {/* 标签列表包装器 */}
      <div ref={wrapperRef} className="ld-tabs-wrapper">
        <div ref={listRef} className="ld-tabs-list" onWheel={handleWheel}>
          {tabs.map((tab, index) => (
            <TabItem
              key={tab.id}
              tab={tab}
              index={index}
              isActive={activeTabId === tab.id}
              isDragging={dragState.dragIndex === index}
              showIcon={showIcon}
              enableDrag={enableDrag}
              onClick={onTabClick}
              onClose={onTabClose}
              onContextMenu={onContextMenu}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </div>

      {/* 右滚动按钮 */}
      {showScrollButtons && canScrollRight && (
        <button className="ld-tabs-scroll-btn" onClick={scrollRight}>
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
          </svg>
        </button>
      )}

      {/* 新增按钮 */}
      {showAddButton && (
        <button className="ld-tabs-add-btn" onClick={onAddTab}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor">
            <path d="M8 3v10M3 8h10" strokeLinecap="round" strokeWidth="2" />
          </svg>
        </button>
      )}
    </div>
  )
})

TabsContainer.displayName = 'TabsContainer'


