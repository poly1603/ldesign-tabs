/**
 * 虚拟滚动标签组件
 * 
 * 性能优化要点：
 * 1. 只渲染可见区域的标签
 * 2. 使用 IntersectionObserver 监测可见性
 * 3. 使用 requestAnimationFrame 优化滚动
 * 4. 预渲染缓冲区
 * 5. DOM 复用
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  memo,
} from 'react'
import type { Tab } from '../types'

interface VirtualTabsProps {
  tabs: ReadonlyArray<Tab>
  activeTabId: string | null
  onTabClick?: (tab: Tab) => void
  onTabClose?: (tab: Tab) => void
  itemHeight?: number
  containerHeight?: number
  bufferSize?: number
  className?: string
}

/**
 * 虚拟滚动标签项组件（优化渲染）
 */
const VirtualTabItem = memo<{
  tab: Tab
  isActive: boolean
  onClick?: () => void
  onClose?: () => void
  style: React.CSSProperties
}>(({ tab, isActive, onClick, onClose, style }) => {
  return (
    <div
      className={`virtual-tab-item ${isActive ? 'active' : ''}`}
      style={style}
      onClick={onClick}
      role="tab"
      aria-selected={isActive}
      data-tab-id={tab.id}
    >
      {tab.icon && <span className="tab-icon">{tab.icon}</span>}
      <span className="tab-title">{tab.title}</span>
      {tab.closable && (
        <button
          className="tab-close"
          onClick={(e) => {
            e.stopPropagation()
            onClose?.()
          }}
          aria-label="Close tab"
        >
          ×
        </button>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // 自定义比较函数，只在必要时重渲染
  return (
    prevProps.tab.id === nextProps.tab.id &&
    prevProps.tab.title === nextProps.tab.title &&
    prevProps.tab.icon === nextProps.tab.icon &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.style === nextProps.style
  )
})

VirtualTabItem.displayName = 'VirtualTabItem'

/**
 * 虚拟滚动标签容器
 */
export const VirtualTabs = memo<VirtualTabsProps>(({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  itemHeight = 40,
  containerHeight = 400,
  bufferSize = 5,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 })

  // 使用 RAF 优化滚动性能
  const rafRef = useRef<number>()

  // 计算可见项数量
  const visibleCount = useMemo(() =>
    Math.ceil(containerHeight / itemHeight) + bufferSize * 2,
    [containerHeight, itemHeight, bufferSize]
  )

  // 处理滚动
  const handleScroll = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }

    rafRef.current = requestAnimationFrame(() => {
      if (!scrollRef.current) return

      const scrollTop = scrollRef.current.scrollTop
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize)
      const end = Math.min(tabs.length, start + visibleCount)

      setVisibleRange({ start, end })
    })
  }, [tabs.length, itemHeight, bufferSize, visibleCount])

  // 滚动到激活的标签
  const scrollToActiveTab = useCallback(() => {
    if (!activeTabId || !scrollRef.current) return

    const index = tabs.findIndex(tab => tab.id === activeTabId)
    if (index === -1) return

    const scrollTop = index * itemHeight
    const containerScrollTop = scrollRef.current.scrollTop
    const containerClientHeight = scrollRef.current.clientHeight

    // 只在标签不可见时滚动
    if (
      scrollTop < containerScrollTop ||
      scrollTop + itemHeight > containerScrollTop + containerClientHeight
    ) {
      scrollRef.current.scrollTo({
        top: scrollTop - containerClientHeight / 2 + itemHeight / 2,
        behavior: 'smooth',
      })
    }
  }, [activeTabId, tabs, itemHeight])

  // 监听激活标签变化
  useEffect(() => {
    scrollToActiveTab()
  }, [scrollToActiveTab])

  // 初始化和清理
  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement) return

    scrollElement.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // 初始计算

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [handleScroll])

  // 渲染的标签
  const visibleTabs = useMemo(() =>
    tabs.slice(visibleRange.start, visibleRange.end),
    [tabs, visibleRange]
  )

  // 总高度
  const totalHeight = tabs.length * itemHeight

  // 偏移量
  const offsetY = visibleRange.start * itemHeight

  return (
    <div
      ref={containerRef}
      className={`virtual-tabs-container ${className}`}
      style={{ height: containerHeight }}
    >
      <div
        ref={scrollRef}
        className="virtual-tabs-scroll"
        style={{
          height: '100%',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        {/* 占位元素，撑开滚动高度 */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* 渲染可见的标签 */}
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            {visibleTabs.map((tab, index) => {
              const actualIndex = visibleRange.start + index
              const isActive = tab.id === activeTabId

              return (
                <VirtualTabItem
                  key={tab.id}
                  tab={tab}
                  isActive={isActive}
                  onClick={() => onTabClick?.(tab)}
                  onClose={() => onTabClose?.(tab)}
                  style={{
                    height: itemHeight,
                    position: 'absolute',
                    top: index * itemHeight,
                    left: 0,
                    right: 0,
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
})

VirtualTabs.displayName = 'VirtualTabs'

/**
 * 横向虚拟滚动标签
 */
export const HorizontalVirtualTabs = memo<VirtualTabsProps>(({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  itemHeight = 40,
  containerHeight = 40,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleTabs, setVisibleTabs] = useState<Tab[]>([])
  const observerRef = useRef<IntersectionObserver>()

  // 使用 IntersectionObserver 监测可见性
  useEffect(() => {
    if (!containerRef.current) return

    // 创建观察器
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const tabId = entry.target.getAttribute('data-tab-id')
          if (!tabId) return

          const tab = tabs.find(t => t.id === tabId)
          if (!tab) return

          if (entry.isIntersecting) {
            setVisibleTabs(prev => {
              if (!prev.find(t => t.id === tabId)) {
                return [...prev, tab]
              }
              return prev
            })
          } else {
            setVisibleTabs(prev => prev.filter(t => t.id !== tabId))
          }
        })
      },
      {
        root: containerRef.current,
        rootMargin: '50px',
        threshold: 0.1,
      }
    )

    // 观察所有标签元素
    const tabElements = containerRef.current.querySelectorAll('[data-tab-id]')
    tabElements.forEach(el => observerRef.current?.observe(el))

    return () => {
      observerRef.current?.disconnect()
    }
  }, [tabs])

  return (
    <div
      ref={containerRef}
      className={`horizontal-virtual-tabs ${className}`}
      style={{
        height: containerHeight,
        display: 'flex',
        overflowX: 'auto',
        overflowY: 'hidden',
        position: 'relative',
      }}
    >
      {tabs.map(tab => {
        const isActive = tab.id === activeTabId
        const isVisible = visibleTabs.some(t => t.id === tab.id)

        return (
          <div
            key={tab.id}
            className={`tab-item ${isActive ? 'active' : ''} ${!isVisible ? 'hidden' : ''}`}
            style={{
              minWidth: 120,
              maxWidth: 200,
              height: itemHeight,
              flexShrink: 0,
              display: isVisible ? 'flex' : 'none',
              alignItems: 'center',
              padding: '0 12px',
              cursor: 'pointer',
            }}
            onClick={() => onTabClick?.(tab)}
            data-tab-id={tab.id}
            role="tab"
            aria-selected={isActive}
          >
            {tab.icon && <span className="tab-icon" style={{ marginRight: 8 }}>{tab.icon}</span>}
            <span className="tab-title" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab.title}</span>
            {tab.closable && (
              <button
                className="tab-close"
                style={{ marginLeft: 8 }}
                onClick={(e) => {
                  e.stopPropagation()
                  onTabClose?.(tab)
                }}
                aria-label="Close tab"
              >
                ×
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
})

HorizontalVirtualTabs.displayName = 'HorizontalVirtualTabs'

