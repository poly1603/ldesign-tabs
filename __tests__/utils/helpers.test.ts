/**
 * 工具函数单元测试
 */

import { describe, it, expect, vi } from 'vitest'
import {
  debounce,
  throttle,
  deepClone,
  truncateTitle,
  extractTitleFromPath,
  isSameTab,
  findTabIndex,
  findTabByPath,
  filterPinnedTabs,
  filterUnpinnedTabs,
  sortTabs,
  moveArrayItem,
} from '../../src/utils/helpers'
import type { Tab } from '../../src/types'

describe('helpers', () => {
  describe('debounce', () => {
    it('应该延迟执行函数', async () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced()
      expect(fn).not.toHaveBeenCalled()

      await new Promise(resolve => setTimeout(resolve, 150))
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('连续调用应该只执行最后一次', async () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced()
      debounced()
      debounced()

      await new Promise(resolve => setTimeout(resolve, 150))
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('throttle', () => {
    it('应该限制函数执行频率', async () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled()
      throttled()
      throttled()

      expect(fn).toHaveBeenCalledTimes(1)

      await new Promise(resolve => setTimeout(resolve, 150))
      throttled()

      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('deepClone', () => {
    it('应该深拷贝对象', () => {
      const original = { name: '测试', nested: { value: 123 } }
      const cloned = deepClone(original)

      cloned.nested.value = 456

      expect(original.nested.value).toBe(123)
      expect(cloned.nested.value).toBe(456)
    })

    it('应该处理数组', () => {
      const original = [1, 2, { value: 3 }]
      const cloned = deepClone(original)

      cloned[2].value = 999

      expect(original[2].value).toBe(3)
      expect(cloned[2].value).toBe(999)
    })

    it('应该处理基本类型', () => {
      expect(deepClone(null)).toBe(null)
      expect(deepClone(123)).toBe(123)
      expect(deepClone('test')).toBe('test')
      expect(deepClone(true)).toBe(true)
    })
  })

  describe('truncateTitle', () => {
    it('应该截断超长标题', () => {
      const title = '这是一个非常长的标签标题'
      const truncated = truncateTitle(title, 10)

      expect(truncated.length).toBeLessThanOrEqual(10)
      expect(truncated).toContain('...')
    })

    it('短标题应保持不变', () => {
      const title = '短标题'
      const truncated = truncateTitle(title, 10)

      expect(truncated).toBe(title)
    })
  })

  describe('extractTitleFromPath', () => {
    it('应该从路径提取标题', () => {
      expect(extractTitleFromPath('/')).toBe('首页')
      expect(extractTitleFromPath('/user-management')).toBe('User Management')
      expect(extractTitleFromPath('/admin/system-config')).toBe('System Config')
    })

    it('应该移除查询参数', () => {
      const title = extractTitleFromPath('/users?page=1')

      expect(title).toBe('Users')
      expect(title).not.toContain('?')
    })
  })

  describe('标签查找', () => {
    const tabs: Tab[] = [
      {
        id: '1',
        title: 'Tab 1',
        path: '/1',
        pinned: false,
        closable: true,
        status: 'normal',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        visitCount: 1,
      },
      {
        id: '2',
        title: 'Tab 2',
        path: '/2',
        pinned: true,
        closable: true,
        status: 'normal',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        visitCount: 1,
      },
    ]

    it('findTabIndex 应该找到标签索引', () => {
      const index = findTabIndex(tabs, '2')

      expect(index).toBe(1)
    })

    it('findTabByPath 应该根据路径找到标签', () => {
      const tab = findTabByPath(tabs, '/1')

      expect(tab).toBeTruthy()
      expect(tab?.id).toBe('1')
    })

    it('isSameTab 应该比较两个标签', () => {
      const same = isSameTab(tabs[0], tabs[0])
      const different = isSameTab(tabs[0], tabs[1])

      expect(same).toBe(true)
      expect(different).toBe(false)
    })
  })

  describe('标签过滤', () => {
    const tabs: Tab[] = [
      {
        id: '1',
        title: 'Pinned',
        path: '/pinned',
        pinned: true,
        closable: true,
        status: 'normal',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        visitCount: 1,
      },
      {
        id: '2',
        title: 'Normal',
        path: '/normal',
        pinned: false,
        closable: true,
        status: 'normal',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        visitCount: 1,
      },
    ]

    it('filterPinnedTabs 应该只返回固定标签', () => {
      const pinned = filterPinnedTabs(tabs)

      expect(pinned.length).toBe(1)
      expect(pinned[0].pinned).toBe(true)
    })

    it('filterUnpinnedTabs 应该只返回非固定标签', () => {
      const unpinned = filterUnpinnedTabs(tabs)

      expect(unpinned.length).toBe(1)
      expect(unpinned[0].pinned).toBe(false)
    })

    it('sortTabs 应该将固定标签排在前面', () => {
      const unsorted = [tabs[1], tabs[0]] // 非固定在前
      const sorted = sortTabs(unsorted)

      expect(sorted[0].pinned).toBe(true)
      expect(sorted[1].pinned).toBe(false)
    })
  })

  describe('数组操作', () => {
    it('moveArrayItem 应该移动数组元素', () => {
      const arr = ['A', 'B', 'C', 'D']
      const moved = moveArrayItem(arr, 1, 3)

      expect(moved).toEqual(['A', 'C', 'D', 'B'])
      expect(arr).toEqual(['A', 'B', 'C', 'D']) // 原数组不变
    })
  })
})

