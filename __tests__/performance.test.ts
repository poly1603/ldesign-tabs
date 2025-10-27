/**
 * 性能基准测试
 * 
 * 测试优化前后的性能差异
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TabManager, createTabManager } from '../src/core/manager'
import { OptimizedTabManager, createOptimizedTabManager } from '../src/core/optimized-manager'
import type { TabConfig } from '../src/types'

// 性能测试工具
class PerformanceTester {
  private startTime: number = 0
  private startMemory: number = 0

  start() {
    if (typeof performance !== 'undefined') {
      this.startTime = performance.now()
      if ('memory' in performance) {
        this.startMemory = (performance as any).memory.usedJSHeapSize
      }
    }
  }

  end() {
    if (typeof performance !== 'undefined') {
      const endTime = performance.now()
      const duration = endTime - this.startTime

      let memoryUsed = 0
      if ('memory' in performance) {
        const endMemory = (performance as any).memory.usedJSHeapSize
        memoryUsed = endMemory - this.startMemory
      }

      return {
        duration,
        memoryUsed,
      }
    }
    return { duration: 0, memoryUsed: 0 }
  }
}

describe('性能基准测试', () => {
  const generateTabs = (count: number): TabConfig[] => {
    const tabs: TabConfig[] = []
    for (let i = 0; i < count; i++) {
      tabs.push({
        title: `Tab ${i}`,
        path: `/tab-${i}`,
        icon: '📄',
        meta: { index: i, data: `data-${i}`.repeat(100) },
      })
    }
    return tabs
  }

  describe('批量添加标签', () => {
    it('原版 vs 优化版 - 添加100个标签', () => {
      const tabs = generateTabs(100)
      const tester = new PerformanceTester()

      // 测试原版
      tester.start()
      const oldManager = createTabManager({ maxTabs: 200 })
      tabs.forEach(tab => oldManager.addTab(tab))
      const oldPerf = tester.end()

      // 测试优化版
      tester.start()
      const newManager = createOptimizedTabManager({ maxTabs: 200 })
      newManager.batchAddTabs(tabs)
      const newPerf = tester.end()

      console.log('批量添加100个标签：')
      console.log(`原版: ${oldPerf.duration.toFixed(2)}ms, 内存: ${(oldPerf.memoryUsed / 1024).toFixed(2)}KB`)
      console.log(`优化版: ${newPerf.duration.toFixed(2)}ms, 内存: ${(newPerf.memoryUsed / 1024).toFixed(2)}KB`)
      console.log(`性能提升: ${((oldPerf.duration - newPerf.duration) / oldPerf.duration * 100).toFixed(1)}%`)

      // 优化版应该更快
      expect(newPerf.duration).toBeLessThan(oldPerf.duration * 0.8) // 至少快20%
    })

    it('原版 vs 优化版 - 添加1000个标签', () => {
      const tabs = generateTabs(1000)
      const tester = new PerformanceTester()

      // 测试原版
      tester.start()
      const oldManager = createTabManager({ maxTabs: 2000 })
      tabs.forEach(tab => oldManager.addTab(tab))
      const oldPerf = tester.end()

      // 测试优化版
      tester.start()
      const newManager = createOptimizedTabManager({ maxTabs: 2000 })
      newManager.batchAddTabs(tabs)
      const newPerf = tester.end()

      console.log('批量添加1000个标签：')
      console.log(`原版: ${oldPerf.duration.toFixed(2)}ms, 内存: ${(oldPerf.memoryUsed / 1024).toFixed(2)}KB`)
      console.log(`优化版: ${newPerf.duration.toFixed(2)}ms, 内存: ${(newPerf.memoryUsed / 1024).toFixed(2)}KB`)
      console.log(`性能提升: ${((oldPerf.duration - newPerf.duration) / oldPerf.duration * 100).toFixed(1)}%`)

      // 优化版应该显著更快
      expect(newPerf.duration).toBeLessThan(oldPerf.duration * 0.5) // 至少快50%
    })
  })

  describe('频繁切换标签', () => {
    it('原版 vs 优化版 - 切换100次', () => {
      const tabs = generateTabs(10)
      const tester = new PerformanceTester()

      // 准备管理器
      const oldManager = createTabManager({ maxTabs: 200 })
      const newManager = createOptimizedTabManager({ maxTabs: 200 })

      tabs.forEach(tab => {
        oldManager.addTab(tab)
        newManager.addTab(tab)
      })

      const tabIds = oldManager.getAllTabs().map(t => t.id)

      // 测试原版切换
      tester.start()
      for (let i = 0; i < 100; i++) {
        oldManager.activateTab(tabIds[i % tabIds.length])
      }
      const oldPerf = tester.end()

      // 测试优化版切换
      tester.start()
      for (let i = 0; i < 100; i++) {
        newManager.activateTab(tabIds[i % tabIds.length])
      }
      const newPerf = tester.end()

      console.log('频繁切换100次标签：')
      console.log(`原版: ${oldPerf.duration.toFixed(2)}ms`)
      console.log(`优化版: ${newPerf.duration.toFixed(2)}ms`)
      console.log(`性能提升: ${((oldPerf.duration - newPerf.duration) / oldPerf.duration * 100).toFixed(1)}%`)

      // 优化版应该更快
      expect(newPerf.duration).toBeLessThanOrEqual(oldPerf.duration)
    })
  })

  describe('查找标签性能', () => {
    it('原版 vs 优化版 - 查找1000次', () => {
      const tabs = generateTabs(100)
      const tester = new PerformanceTester()

      // 准备管理器
      const oldManager = createTabManager({ maxTabs: 200 })
      const newManager = createOptimizedTabManager({ maxTabs: 200 })

      tabs.forEach(tab => {
        oldManager.addTab(tab)
        newManager.addTab(tab)
      })

      const tabIds = oldManager.getAllTabs().map(t => t.id)
      const paths = tabs.map(t => t.path)

      // 测试原版查找
      tester.start()
      for (let i = 0; i < 1000; i++) {
        oldManager.getTab(tabIds[i % tabIds.length])
        oldManager.hasDuplicateTab(paths[i % paths.length])
      }
      const oldPerf = tester.end()

      // 测试优化版查找（使用索引）
      tester.start()
      for (let i = 0; i < 1000; i++) {
        newManager.getTab(tabIds[i % tabIds.length])
        newManager.getTabByPath(paths[i % paths.length])
      }
      const newPerf = tester.end()

      console.log('查找1000次标签：')
      console.log(`原版: ${oldPerf.duration.toFixed(2)}ms`)
      console.log(`优化版: ${newPerf.duration.toFixed(2)}ms`)
      console.log(`性能提升: ${((oldPerf.duration - newPerf.duration) / oldPerf.duration * 100).toFixed(1)}%`)

      // 优化版应该显著更快（使用了索引）
      expect(newPerf.duration).toBeLessThan(oldPerf.duration * 0.3) // 至少快70%
    })
  })

  describe('内存使用对比', () => {
    it('深拷贝 vs 不可变数据', () => {
      const tabs = generateTabs(100)
      const tester = new PerformanceTester()

      // 测试原版（深拷贝）
      tester.start()
      const oldManager = createTabManager({ maxTabs: 1000 })
      tabs.forEach(tab => oldManager.addTab(tab))

      // 触发多次更新操作
      for (let i = 0; i < 50; i++) {
        const allTabs = oldManager.getAllTabs()
        allTabs.forEach(tab => {
          oldManager.updateTab(tab.id, { status: 'loading' })
        })
      }
      const oldPerf = tester.end()

      // 测试优化版（不可变数据）
      tester.start()
      const newManager = createOptimizedTabManager({ maxTabs: 1000 })
      newManager.batchAddTabs(tabs)

      // 触发多次更新操作
      for (let i = 0; i < 50; i++) {
        const allTabs = newManager.getAllTabs()
        allTabs.forEach(tab => {
          newManager.updateTab(tab.id, { status: 'loading' })
        })
      }
      const newPerf = tester.end()

      console.log('内存使用对比（100标签×50次更新）：')
      console.log(`原版: 内存使用 ${(oldPerf.memoryUsed / 1024).toFixed(2)}KB`)
      console.log(`优化版: 内存使用 ${(newPerf.memoryUsed / 1024).toFixed(2)}KB`)
      console.log(`内存节省: ${((oldPerf.memoryUsed - newPerf.memoryUsed) / oldPerf.memoryUsed * 100).toFixed(1)}%`)

      // 优化版应该使用更少内存
      expect(newPerf.memoryUsed).toBeLessThanOrEqual(oldPerf.memoryUsed)
    })
  })

  describe('事件系统性能', () => {
    it('事件批处理性能测试', () => {
      const newManager = createOptimizedTabManager({ maxTabs: 1000 })
      const tester = new PerformanceTester()
      let eventCount = 0

      // 注册监听器
      newManager.events.on('tab:add', () => {
        eventCount++
      })

      const tabs = generateTabs(100)

      // 测试批量添加（会批处理事件）
      tester.start()
      newManager.batchAddTabs(tabs)
      const batchPerf = tester.end()

      console.log('事件批处理性能：')
      console.log(`批量添加100个标签: ${batchPerf.duration.toFixed(2)}ms`)
      console.log(`事件触发次数: ${eventCount}`)

      // 批处理应该很快
      expect(batchPerf.duration).toBeLessThan(50) // 小于50ms
    })
  })

  describe('虚拟化支持', () => {
    it('大量标签的可见范围管理', () => {
      const newManager = createOptimizedTabManager({ maxTabs: 10000 })
      const tabs = generateTabs(5000)
      const tester = new PerformanceTester()

      // 添加大量标签
      tester.start()
      newManager.batchAddTabs(tabs)
      const addPerf = tester.end()

      // 设置可见范围
      tester.start()
      for (let i = 0; i < 100; i++) {
        newManager.setVisibleRange(i * 20, (i + 1) * 20)
        const visible = newManager.getVisibleTabs()
        expect(visible.length).toBeLessThanOrEqual(20)
      }
      const rangePerf = tester.end()

      console.log('虚拟化支持测试：')
      console.log(`添加5000个标签: ${addPerf.duration.toFixed(2)}ms`)
      console.log(`100次范围切换: ${rangePerf.duration.toFixed(2)}ms`)

      // 范围切换应该很快
      expect(rangePerf.duration).toBeLessThan(100) // 小于100ms
    })
  })
})

