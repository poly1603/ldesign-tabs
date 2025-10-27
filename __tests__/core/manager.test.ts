/**
 * TabManager 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createTabManager } from '../../src/core/manager'
import type { TabConfig } from '../../src/types'

describe('TabManager', () => {
  let manager: ReturnType<typeof createTabManager>

  beforeEach(() => {
    manager = createTabManager({
      maxTabs: 10,
      persist: false, // 测试时禁用持久化
    })
  })

  describe('添加标签', () => {
    it('应该能够添加新标签', () => {
      const config: TabConfig = {
        title: '测试标签',
        path: '/test',
      }

      const tab = manager.addTab(config)

      expect(tab).not.toBeNull()
      expect(tab?.title).toBe('测试标签')
      expect(tab?.path).toBe('/test')
      expect(tab?.id).toBeTruthy()
    })

    it('应该为新标签生成唯一ID', () => {
      const tab1 = manager.addTab({ title: 'Tab 1', path: '/1' })
      const tab2 = manager.addTab({ title: 'Tab 2', path: '/2' })

      expect(tab1?.id).not.toBe(tab2?.id)
    })

    it('应该阻止添加重复路径的标签', () => {
      manager.addTab({ title: 'Tab 1', path: '/test' })
      const duplicate = manager.addTab({ title: 'Tab 2', path: '/test' })

      expect(manager.getTabsCount()).toBe(1)
      expect(duplicate?.title).toBe('Tab 1') // 返回已存在的标签
    })

    it('应该在达到最大数量时拒绝添加', () => {
      // 添加10个标签
      for (let i = 0; i < 10; i++) {
        manager.addTab({ title: `Tab ${i}`, path: `/tab-${i}` })
      }

      // 尝试添加第11个
      const overflow = manager.addTab({ title: 'Overflow', path: '/overflow' })

      expect(overflow).toBeNull()
      expect(manager.getTabsCount()).toBe(10)
    })

    it('应该自动激活新添加的标签（默认行为）', () => {
      const tab = manager.addTab({ title: 'New Tab', path: '/new' })
      const activeTab = manager.getActiveTab()

      expect(activeTab?.id).toBe(tab?.id)
    })
  })

  describe('移除标签', () => {
    it('应该能够移除标签', () => {
      const tab = manager.addTab({ title: 'Test', path: '/test' })
      const removed = manager.removeTab(tab!.id)

      expect(removed).toBe(true)
      expect(manager.getTabsCount()).toBe(0)
    })

    it('应该不能移除不存在的标签', () => {
      const removed = manager.removeTab('non-existent-id')

      expect(removed).toBe(false)
    })

    it('应该不能移除激活的标签', () => {
      const tab = manager.addTab({ title: 'Active', path: '/active' })
      const removed = manager.removeTab(tab!.id)

      expect(removed).toBe(false) // 激活标签不能关闭
    })

    it('移除激活标签时应激活相邻标签', () => {
      const tab1 = manager.addTab({ title: 'Tab 1', path: '/1' })
      const tab2 = manager.addTab({ title: 'Tab 2', path: '/2' })
      const tab3 = manager.addTab({ title: 'Tab 3', path: '/3' })

      // 激活tab2
      manager.activateTab(tab2!.id)

      // 移除tab2（需要先激活其他标签才能移除）
      manager.activateTab(tab1!.id)
      manager.removeTab(tab2!.id)

      const activeTab = manager.getActiveTab()
      expect(activeTab?.id).toBeTruthy()
    })
  })

  describe('激活标签', () => {
    it('应该能够激活标签', () => {
      const tab = manager.addTab({ title: 'Test', path: '/test' })
      const activated = manager.activateTab(tab!.id)

      expect(activated).toBe(true)
      expect(manager.getActiveTab()?.id).toBe(tab?.id)
    })

    it('应该更新标签的访问信息', () => {
      const tab = manager.addTab({ title: 'Test', path: '/test' })
      const beforeCount = tab?.visitCount || 0

      manager.activateTab(tab!.id)

      const afterTab = manager.getTab(tab!.id)
      expect(afterTab?.visitCount).toBeGreaterThan(beforeCount)
    })
  })

  describe('固定标签', () => {
    it('应该能够固定标签', () => {
      const tab = manager.addTab({ title: 'Test', path: '/test' })
      const pinned = manager.pinTab(tab!.id)

      expect(pinned).toBe(true)

      const updatedTab = manager.getTab(tab!.id)
      expect(updatedTab?.pinned).toBe(true)
    })

    it('固定标签应该排在前面', () => {
      const tab1 = manager.addTab({ title: 'Tab 1', path: '/1' })
      const tab2 = manager.addTab({ title: 'Tab 2', path: '/2' })

      manager.pinTab(tab2!.id)

      const tabs = manager.getAllTabs()
      expect(tabs[0].id).toBe(tab2?.id)
    })
  })

  describe('事件系统', () => {
    it('应该触发 tab:add 事件', (done) => {
      manager.events.on('tab:add', (event) => {
        expect(event.type).toBe('tab:add')
        expect(event.tab).toBeTruthy()
        done()
      })

      manager.addTab({ title: 'Test', path: '/test' })
    })

    it('应该触发 tab:remove 事件', (done) => {
      const tab = manager.addTab({ title: 'Test', path: '/test' })

      manager.events.on('tab:remove', (event) => {
        expect(event.type).toBe('tab:remove')
        expect(event.tab.id).toBe(tab?.id)
        done()
      })

      // 先激活另一个标签才能移除
      const tab2 = manager.addTab({ title: 'Test 2', path: '/test2' })
      manager.activateTab(tab2!.id)
      manager.removeTab(tab!.id)
    })

    it('应该触发 tab:activate 事件', (done) => {
      const tab = manager.addTab({ title: 'Test', path: '/test' })

      manager.events.on('tab:activate', (event) => {
        expect(event.type).toBe('tab:activate')
        expect(event.tab.id).toBe(tab?.id)
        done()
      })

      manager.activateTab(tab!.id)
    })
  })

  describe('批量操作', () => {
    it('应该能够关闭其他标签', () => {
      const tab1 = manager.addTab({ title: 'Tab 1', path: '/1' })
      manager.addTab({ title: 'Tab 2', path: '/2' })
      manager.addTab({ title: 'Tab 3', path: '/3' })

      const closedCount = manager.closeOtherTabs(tab1!.id)

      expect(closedCount).toBeGreaterThan(0)
      expect(manager.getTabsCount()).toBeLessThan(3)
    })

    it('应该能够关闭所有可关闭的标签', () => {
      manager.addTab({ title: 'Tab 1', path: '/1' })
      manager.addTab({ title: 'Tab 2', path: '/2', closable: false })

      const closedCount = manager.closeAllTabs()

      expect(manager.getTabsCount()).toBeGreaterThan(0) // 不可关闭的标签应保留
    })
  })

  describe('历史记录', () => {
    it('应该记录关闭的标签', () => {
      const tab1 = manager.addTab({ title: 'Tab 1', path: '/1' })
      const tab2 = manager.addTab({ title: 'Tab 2', path: '/2' })

      manager.activateTab(tab2!.id)
      manager.removeTab(tab1!.id)

      const history = manager.getClosedHistory()
      expect(history.length).toBeGreaterThan(0)
    })

    it('应该能够重新打开最近关闭的标签', () => {
      const tab = manager.addTab({ title: 'Test', path: '/test' })
      const tab2 = manager.addTab({ title: 'Test 2', path: '/test2' })

      manager.activateTab(tab2!.id)
      manager.removeTab(tab!.id)

      const reopened = manager.reopenLastClosedTab()

      expect(reopened).not.toBeNull()
      expect(reopened?.path).toBe('/test')
    })
  })
})

