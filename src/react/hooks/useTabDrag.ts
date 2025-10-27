/**
 * React Hooks - useTabDrag
 * 
 * 提供标签拖拽功能的 Hook。
 * 处理拖拽逻辑，返回拖拽事件处理器和状态。
 * 
 * @example
 * ```tsx
 * import { useTabDrag } from '@ldesign/tabs/react'
 * 
 * function TabItem({ tab, index }) {
 *   const { isDragging, dragHandlers } = useTabDrag(manager, index)
 * 
 *   return (
 *     <div
 *       draggable
 *       {...dragHandlers}
 *       className={isDragging ? 'dragging' : ''}
 *     >
 *       {tab.title}
 *     </div>
 *   )
 * }
 * ```
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { DragConfig } from '../../types'
import { createDragHandler, type DragHandler, type TabManager } from '../../core'

/**
 * useTabDrag Hook 配置
 */
export interface UseTabDragConfig extends DragConfig {
  /** 当前标签索引 */
  index: number
  /** 拖拽开始回调 */
  onDragStart?: (index: number) => void
  /** 拖拽结束回调 */
  onDragEnd?: (fromIndex: number, toIndex: number) => void
}

/**
 * useTabDrag Hook 返回值
 */
export interface UseTabDragReturn {
  /** 是否正在拖拽 */
  isDragging: boolean
  /** 是否为放置目标 */
  isDropTarget: boolean
  /** 拖拽事件处理器对象 */
  dragHandlers: {
    onDragStart: (event: React.DragEvent) => void
    onDragEnd: (event: React.DragEvent) => void
    onDragOver: (event: React.DragEvent) => void
    onDragEnter: (event: React.DragEvent) => void
    onDragLeave: (event: React.DragEvent) => void
    onDrop: (event: React.DragEvent) => void
  }
}

/**
 * useTabDrag Hook
 * 
 * 为标签元素提供拖拽功能。
 * 
 * @param manager - 标签管理器实例
 * @param config - 配置选项
 * @returns Hook 返回值对象
 * 
 * @example
 * ```tsx
 * function DraggableTab({ tab, index, manager }) {
 *   const { isDragging, isDropTarget, dragHandlers } = useTabDrag(manager, {
 *     index,
 *     enabled: true,
 *     delay: 100
 *   })
 * 
 *   return (
 *     <div
 *       draggable
 *       {...dragHandlers}
 *       className={`tab ${isDragging ? 'dragging' : ''} ${isDropTarget ? 'drop-target' : ''}`}
 *     >
 *       {tab.title}
 *     </div>
 *   )
 * }
 * ```
 */
export function useTabDrag(
  manager: TabManager,
  config: UseTabDragConfig
): UseTabDragReturn {
  const dragHandlerRef = useRef<DragHandler>()
  const [isDragging, setIsDragging] = useState(false)
  const [isDropTarget, setIsDropTarget] = useState(false)

  // 创建拖拽处理器（只创建一次）
  if (!dragHandlerRef.current) {
    dragHandlerRef.current = createDragHandler(manager, {
      enabled: config.enabled !== false,
      delay: config.delay,
      distance: config.distance,
    })
  }

  const dragHandler = dragHandlerRef.current

  // 拖拽开始
  const handleDragStart = useCallback(
    (event: React.DragEvent) => {
      setIsDragging(true)
      dragHandler.handleDragStart(event.nativeEvent, config.index)
      config.onDragStart?.(config.index)
    },
    [dragHandler, config]
  )

  // 拖拽结束
  const handleDragEnd = useCallback(
    (event: React.DragEvent) => {
      const state = dragHandler.getDragState()
      setIsDragging(false)
      setIsDropTarget(false)
      dragHandler.handleDragEnd(event.nativeEvent)

      if (state.dragIndex !== -1 && state.dropIndex !== -1) {
        config.onDragEnd?.(state.dragIndex, state.dropIndex)
      }
    },
    [dragHandler, config]
  )

  // 拖拽经过
  const handleDragOver = useCallback(
    (event: React.DragEvent) => {
      setIsDropTarget(true)
      dragHandler.handleDragOver(event.nativeEvent, config.index)
    },
    [dragHandler, config.index]
  )

  // 拖拽进入
  const handleDragEnter = useCallback(
    (event: React.DragEvent) => {
      setIsDropTarget(true)
      dragHandler.handleDragEnter(event.nativeEvent, config.index)
    },
    [dragHandler, config.index]
  )

  // 拖拽离开
  const handleDragLeave = useCallback(
    (event: React.DragEvent) => {
      setIsDropTarget(false)
      dragHandler.handleDragLeave(event.nativeEvent)
    },
    [dragHandler]
  )

  // 放置
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      setIsDropTarget(false)
      dragHandler.handleDrop(event.nativeEvent, config.index)
    },
    [dragHandler, config.index]
  )

  // 清理
  useEffect(() => {
    return () => {
      dragHandler.destroy()
    }
  }, [dragHandler])

  return {
    isDragging,
    isDropTarget,
    dragHandlers: {
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      onDragOver: handleDragOver,
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  }
}


