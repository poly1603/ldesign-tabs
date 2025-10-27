/**
 * SearchEngine 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createTabManager, createSearchEngine } from '../../src/core'

describe('SearchEngine', () => {
  let manager: ReturnType<typeof createTabManager>
  let searchEngine: ReturnType<typeof createSearchEngine>

  beforeEach(() => {
    manager = createTabManager({ persist: false })
    searchEngine = createSearchEngine(manager)

    // 添加测试数据
    manager.addTab({ title: '用户管理', path: '/admin/users', icon: '👥' })
    manager.addTab({ title: '系统设置', path: '/admin/settings', icon: '⚙️' })
    manager.addTab({ title: '数据分析', path: '/analytics', icon: '📊' })
    manager.addTab({ title: '用户反馈', path: '/feedback', icon: '💬' })
  })

  describe('简单搜索', () => {
    it('应该能够搜索标签标题', () => {
      const results = searchEngine.search('用户')

      expect(results.length).toBeGreaterThan(0)
      expect(results.some(r => r.tab.title.includes('用户'))).toBe(true)
    })

    it('应该返回相关度评分', () => {
      const results = searchEngine.search('用户')

      results.forEach(result => {
        expect(result.score).toBeGreaterThan(0)
        expect(result.score).toBeLessThanOrEqual(100)
      })
    })

    it('应该按相关度排序', () => {
      const results = searchEngine.search('用户')

      if (results.length > 1) {
        expect(results[0].score).toBeGreaterThanOrEqual(results[1].score)
      }
    })

    it('空关键词应返回空数组', () => {
      const results = searchEngine.search('')

      expect(results).toEqual([])
    })
  })

  describe('高级搜索', () => {
    it('应该能够按状态过滤', () => {
      const results = searchEngine.advancedSearch({
        status: 'normal',
      })

      results.forEach(result => {
        expect(result.tab.status).toBe('normal')
      })
    })

    it('应该能够按固定状态过滤', () => {
      const tab = manager.addTab({ title: 'Pinned', path: '/pinned' })
      manager.pinTab(tab!.id)

      const results = searchEngine.advancedSearch({
        pinned: true,
      })

      expect(results.length).toBeGreaterThan(0)
      results.forEach(result => {
        expect(result.tab.pinned).toBe(true)
      })
    })

    it('应该能够限制结果数量', () => {
      const results = searchEngine.advancedSearch({
        limit: 2,
      })

      expect(results.length).toBeLessThanOrEqual(2)
    })
  })

  describe('搜索历史', () => {
    it('应该记录搜索历史', () => {
      searchEngine.search('用户')

      const history = searchEngine.getSearchHistory()

      expect(history.length).toBeGreaterThan(0)
      expect(history[0].keyword).toBe('用户')
    })

    it('应该能够清除搜索历史', () => {
      searchEngine.search('测试')
      searchEngine.clearSearchHistory()

      const history = searchEngine.getSearchHistory()

      expect(history.length).toBe(0)
    })
  })

  describe('文本高亮', () => {
    it('应该能够高亮匹配的文本', () => {
      const highlighted = searchEngine.highlightText('用户管理系统', '用户')

      expect(highlighted).toContain('<mark>')
      expect(highlighted).toContain('用户')
      expect(highlighted).toContain('</mark>')
    })

    it('未匹配时应返回原文本', () => {
      const highlighted = searchEngine.highlightText('系统设置', '用户')

      expect(highlighted).toBe('系统设置')
      expect(highlighted).not.toContain('<mark>')
    })
  })
})

