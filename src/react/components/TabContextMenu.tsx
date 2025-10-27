/**
 * React 组件 - TabContextMenu
 * 
 * 标签页右键菜单组件。
 * 
 * @example
 * ```tsx
 * <TabContextMenu
 *   visible={showMenu}
 *   x={menuX}
 *   y={menuY}
 *   tab={currentTab}
 *   onClose={() => setShowMenu(false)}
 *   onPin={handlePin}
 *   onUnpin={handleUnpin}
 *   onCloseOthers={handleCloseOthers}
 * />
 * ```
 */

import React, { memo, useEffect, useRef } from 'react'
import type { Tab } from '../../types'

/**
 * 菜单项接口
 */
export interface MenuItem {
  /** 菜单项标签 */
  label: string
  /** 是否禁用 */
  disabled?: boolean
  /** 点击处理器 */
  handler: (tab: Tab) => void
}

/**
 * TabContextMenu Props
 */
export interface TabContextMenuProps {
  /** 是否显示 */
  visible: boolean
  /** X坐标 */
  x: number
  /** Y坐标 */
  y: number
  /** 当前标签 */
  tab: Tab | null
  /** 标签索引 */
  tabIndex?: number
  /** 总标签数 */
  totalTabs?: number
  /** 自定义菜单项 */
  customItems?: MenuItem[]

  // 事件回调
  /** 关闭菜单 */
  onClose?: () => void
  /** 固定标签 */
  onPin?: (tab: Tab) => void
  /** 取消固定 */
  onUnpin?: (tab: Tab) => void
  /** 关闭其他 */
  onCloseOthers?: (tab: Tab) => void
  /** 关闭左侧 */
  onCloseLeft?: (tab: Tab) => void
  /** 关闭右侧 */
  onCloseRight?: (tab: Tab) => void
  /** 关闭所有 */
  onCloseAll?: () => void
}

/**
 * TabContextMenu 组件
 */
export const TabContextMenu = memo<TabContextMenuProps>(({
  visible,
  x,
  y,
  tab,
  tabIndex = 0,
  totalTabs = 0,
  customItems = [],
  onClose,
  onPin,
  onUnpin,
  onCloseOthers,
  onCloseLeft,
  onCloseRight,
  onCloseAll,
}) => {
  const menuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭菜单
  useEffect(() => {
    if (!visible) return

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose?.()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [visible, onClose])

  // ESC 键关闭菜单
  useEffect(() => {
    if (!visible) return

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('keydown', handleEsc)
    }
  }, [visible, onClose])

  if (!visible || !tab) {
    return null
  }

  const handleItemClick = (handler: () => void) => {
    handler()
    onClose?.()
  }

  const canCloseLeft = tabIndex > 0
  const canCloseRight = tabIndex < totalTabs - 1

  return (
    <div
      ref={menuRef}
      className="ld-tabs-context-menu"
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 9999,
      }}
    >
      {/* 固定/取消固定 */}
      {tab.pinned ? (
        <div
          className="ld-tabs-menu-item"
          onClick={() => handleItemClick(() => onUnpin?.(tab))}
        >
          取消固定
        </div>
      ) : (
        <div
          className="ld-tabs-menu-item"
          onClick={() => handleItemClick(() => onPin?.(tab))}
        >
          固定标签
        </div>
      )}

      <div className="ld-tabs-menu-divider" />

      {/* 关闭其他 */}
      <div
        className="ld-tabs-menu-item"
        onClick={() => handleItemClick(() => onCloseOthers?.(tab))}
      >
        关闭其他标签
      </div>

      {/* 关闭左侧 */}
      <div
        className={`ld-tabs-menu-item ${!canCloseLeft ? 'disabled' : ''}`}
        onClick={() => canCloseLeft && handleItemClick(() => onCloseLeft?.(tab))}
      >
        关闭左侧标签
      </div>

      {/* 关闭右侧 */}
      <div
        className={`ld-tabs-menu-item ${!canCloseRight ? 'disabled' : ''}`}
        onClick={() => canCloseRight && handleItemClick(() => onCloseRight?.(tab))}
      >
        关闭右侧标签
      </div>

      {/* 关闭所有 */}
      <div
        className="ld-tabs-menu-item"
        onClick={() => handleItemClick(() => onCloseAll?.())}
      >
        关闭所有标签
      </div>

      {/* 自定义菜单项 */}
      {customItems.length > 0 && (
        <>
          <div className="ld-tabs-menu-divider" />
          {customItems.map((item, index) => (
            <div
              key={index}
              className={`ld-tabs-menu-item ${item.disabled ? 'disabled' : ''}`}
              onClick={() => !item.disabled && handleItemClick(() => item.handler(tab))}
            >
              {item.label}
            </div>
          ))}
        </>
      )}
    </div>
  )
})

TabContextMenu.displayName = 'TabContextMenu'


