/**
 * 优化版 Tabs 使用示例
 * 
 * 展示如何使用性能优化版本的标签系统
 */

import React, { useCallback } from 'react'
import {
  useOptimizedTabs,
  VirtualTabs,
  HorizontalVirtualTabs
} from '../src/react'
import { globalMonitor } from '../src/utils'
import type { TabConfig } from '../src/types'

/**
 * 优化版示例组件
 */
export function OptimizedTabsDemo() {
  // 使用优化版 Hook
  const {
    tabs,
    visibleTabs,
    activeTabId,
    addTab,
    addTabs,
    removeTab,
    activateTab,
    pinTab,
    unpinTab,
    closeOtherTabs,
    setVisibleRange,
    manager,
  } = useOptimizedTabs({
    maxTabs: 10000,           // 支持大量标签
    virtualScroll: true,      // 启用虚拟滚动
    visibleCount: 30,         // 可见数量
    debounceMs: 100,          // 防抖延迟
    persist: true,            // 持久化存储
  })

  // 批量添加测试标签
  const handleAddBatchTabs = useCallback(() => {
    // 开始性能监控
    globalMonitor.startTimer('batchAdd')

    // 生成100个测试标签
    const newTabs: TabConfig[] = []
    for (let i = 0; i < 100; i++) {
      newTabs.push({
        title: `Tab ${Date.now()}-${i}`,
        path: `/tab-${Date.now()}-${i}`,
        icon: ['📄', '📁', '📊', '📈', '📉'][i % 5],
        meta: { index: i },
      })
    }

    // 批量添加（优化版）
    const added = addTabs(newTabs)

    // 结束计时
    const duration = globalMonitor.endTimer('batchAdd')
    console.log(`批量添加 ${added.length} 个标签耗时: ${duration.toFixed(2)}ms`)

    // 输出性能报告
    globalMonitor.logToConsole()
  }, [addTabs])

  // 添加单个标签
  const handleAddTab = useCallback(() => {
    const tab = addTab({
      title: `新标签 ${Date.now()}`,
      path: `/new-${Date.now()}`,
      icon: '📄',
    })

    if (tab) {
      console.log('添加标签成功:', tab.id)
    }
  }, [addTab])

  // 性能测试
  const handlePerformanceTest = useCallback(() => {
    console.group('🧪 性能测试')

    // 测试查找性能
    globalMonitor.startTimer('search')
    for (let i = 0; i < 1000; i++) {
      const randomIndex = Math.floor(Math.random() * tabs.length)
      const tab = tabs[randomIndex]
      if (tab) {
        manager.getTab(tab.id) // 使用索引查找 O(1)
      }
    }
    const searchTime = globalMonitor.endTimer('search')
    console.log(`查找1000次耗时: ${searchTime.toFixed(2)}ms`)

    // 测试激活性能
    globalMonitor.startTimer('activate')
    for (let i = 0; i < 100; i++) {
      const randomIndex = Math.floor(Math.random() * tabs.length)
      const tab = tabs[randomIndex]
      if (tab) {
        activateTab(tab.id)
      }
    }
    const activateTime = globalMonitor.endTimer('activate')
    console.log(`切换100次耗时: ${activateTime.toFixed(2)}ms`)

    // 获取性能指标
    const metrics = globalMonitor.getMetrics()
    console.table({
      '内存使用': `${metrics.memoryUsed.toFixed(2)}MB`,
      '内存占比': `${metrics.memoryPercent.toFixed(1)}%`,
      '标签总数': metrics.totalTabs,
      '可见标签': metrics.visibleTabs,
      '缓存命中': `${metrics.cacheHitRate.toFixed(1)}%`,
      '性能等级': globalMonitor.getPerformanceLevel(),
    })

    console.groupEnd()
  }, [tabs, manager, activateTab])

  // 虚拟滚动演示
  const handleVirtualScrollDemo = useCallback(() => {
    console.log('🖱️ 虚拟滚动演示')

    // 模拟滚动到不同位置
    const positions = [
      { start: 0, end: 30 },
      { start: 100, end: 130 },
      { start: 500, end: 530 },
      { start: 1000, end: 1030 },
    ]

    positions.forEach(({ start, end }, index) => {
      setTimeout(() => {
        setVisibleRange(start, end)
        console.log(`滚动到位置: ${start}-${end}`)
      }, index * 1000)
    })
  }, [setVisibleRange])

  return (
    <div className="optimized-tabs-demo">
      <h1>🚀 优化版 Tabs 演示</h1>

      {/* 控制按钮 */}
      <div className="controls" style={{ marginBottom: 20 }}>
        <button onClick={handleAddTab}>添加标签</button>
        <button onClick={handleAddBatchTabs}>批量添加100个</button>
        <button onClick={() => closeOtherTabs(activeTabId!)}>关闭其他</button>
        <button onClick={handlePerformanceTest}>性能测试</button>
        <button onClick={handleVirtualScrollDemo}>虚拟滚动演示</button>
        <button onClick={() => globalMonitor.logToConsole()}>查看性能</button>
      </div>

      {/* 统计信息 */}
      <div className="stats" style={{ marginBottom: 20 }}>
        <span>总标签: {tabs.length}</span>
        <span style={{ marginLeft: 20 }}>可见: {visibleTabs.length}</span>
        <span style={{ marginLeft: 20 }}>激活: {activeTabId}</span>
      </div>

      {/* 虚拟滚动标签容器 */}
      <div style={{ marginBottom: 20 }}>
        <h3>纵向虚拟滚动（列表模式）</h3>
        <VirtualTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onTabClick={(tab) => activateTab(tab.id)}
          onTabClose={(tab) => removeTab(tab.id)}
          containerHeight={300}
          itemHeight={40}
          virtualScroll={true}
        />
      </div>

      {/* 横向虚拟滚动标签 */}
      <div>
        <h3>横向虚拟滚动（标签栏模式）</h3>
        <HorizontalVirtualTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onTabClick={(tab) => activateTab(tab.id)}
          onTabClose={(tab) => removeTab(tab.id)}
        />
      </div>

      {/* 性能监控面板 */}
      <div style={{ marginTop: 40, padding: 20, backgroundColor: '#f5f5f5' }}>
        <h3>📊 性能监控</h3>
        <PerformancePanel />
      </div>
    </div>
  )
}

/**
 * 性能监控面板
 */
function PerformancePanel() {
  const [metrics, setMetrics] = React.useState(globalMonitor.getMetrics())

  React.useEffect(() => {
    const timer = setInterval(() => {
      setMetrics(globalMonitor.getMetrics())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const level = globalMonitor.getPerformanceLevel()
  const levelColor = {
    excellent: 'green',
    good: 'blue',
    warning: 'orange',
    poor: 'red',
  }[level]

  return (
    <div>
      <div style={{ color: levelColor, fontWeight: 'bold', fontSize: 18 }}>
        性能等级: {level.toUpperCase()}
      </div>

      <table style={{ width: '100%', marginTop: 10 }}>
        <tbody>
          <tr>
            <td>渲染时间:</td>
            <td>{metrics.renderTime.toFixed(2)}ms</td>
            <td>更新时间:</td>
            <td>{metrics.updateTime.toFixed(2)}ms</td>
          </tr>
          <tr>
            <td>内存使用:</td>
            <td>{metrics.memoryUsed.toFixed(2)}MB</td>
            <td>内存占比:</td>
            <td>{metrics.memoryPercent.toFixed(1)}%</td>
          </tr>
          <tr>
            <td>标签总数:</td>
            <td>{metrics.totalTabs}</td>
            <td>可见标签:</td>
            <td>{metrics.visibleTabs}</td>
          </tr>
          <tr>
            <td>缓存命中:</td>
            <td>{metrics.cacheHitRate.toFixed(1)}%</td>
            <td>索引大小:</td>
            <td>{metrics.indexSize}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default OptimizedTabsDemo
