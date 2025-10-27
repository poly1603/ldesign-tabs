/**
 * TemplateManager 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createTabManager, createTemplateManager, createTabStorage } from '../../src/core'

describe('TemplateManager', () => {
  let manager: ReturnType<typeof createTabManager>
  let templateManager: ReturnType<typeof createTemplateManager>
  let storage: ReturnType<typeof createTabStorage>

  beforeEach(() => {
    storage = createTabStorage('test')
    manager = createTabManager({ persist: false })
    templateManager = createTemplateManager(manager, storage)
  })

  describe('保存模板', () => {
    it('应该能够保存当前标签为模板', () => {
      manager.addTab({ title: 'Tab 1', path: '/1' })
      manager.addTab({ title: 'Tab 2', path: '/2' })

      const template = templateManager.saveTemplate({
        name: '测试模板',
        description: '测试描述',
      })

      expect(template).toBeTruthy()
      expect(template.name).toBe('测试模板')
      expect(template.tabs.length).toBe(2)
    })

    it('保存的模板应包含标签信息', () => {
      manager.addTab({ title: 'Tab 1', path: '/1', icon: '🏠' })

      const template = templateManager.saveTemplate({ name: '测试' })

      expect(template.tabs[0].title).toBe('Tab 1')
      expect(template.tabs[0].path).toBe('/1')
      expect(template.tabs[0].icon).toBe('🏠')
    })
  })

  describe('加载模板', () => {
    it('应该能够加载模板', () => {
      manager.addTab({ title: 'Tab 1', path: '/1' })
      const template = templateManager.saveTemplate({ name: '测试' })

      manager.closeAllTabs()
      expect(manager.getTabsCount()).toBe(0)

      templateManager.loadTemplate(template.id)

      expect(manager.getTabsCount()).toBeGreaterThan(0)
    })

    it('加载模板应创建相应的标签', () => {
      manager.addTab({ title: 'Original', path: '/original' })
      const template = templateManager.saveTemplate({ name: '测试' })

      manager.closeAllTabs()
      templateManager.loadTemplate(template.id)

      const tabs = manager.getAllTabs()
      expect(tabs.some(t => t.title === 'Original')).toBe(true)
    })
  })

  describe('导入导出', () => {
    it('应该能够导出模板为JSON', () => {
      manager.addTab({ title: 'Test', path: '/test' })
      const template = templateManager.saveTemplate({ name: '测试' })

      const json = templateManager.exportTemplate(template.id)

      expect(json).toBeTruthy()
      expect(typeof json).toBe('string')
      expect(json).toContain('测试')
    })

    it('应该能够从JSON导入模板', () => {
      manager.addTab({ title: 'Test', path: '/test' })
      const template = templateManager.saveTemplate({ name: '原始' })
      const json = templateManager.exportTemplate(template.id)!

      const imported = templateManager.importTemplate(json)

      expect(imported).toBeTruthy()
      expect(imported?.name).toBe('原始')
      expect(imported?.id).not.toBe(template.id) // 应该生成新ID
    })
  })

  describe('模板管理', () => {
    it('应该能够删除模板', () => {
      manager.addTab({ title: 'Test', path: '/test' })
      const template = templateManager.saveTemplate({ name: '测试' })

      const deleted = templateManager.deleteTemplate(template.id)

      expect(deleted).toBe(true)
      expect(templateManager.getTemplate(template.id)).toBeUndefined()
    })

    it('应该能够获取所有模板', () => {
      manager.addTab({ title: 'Test 1', path: '/1' })
      templateManager.saveTemplate({ name: '模板1' })

      manager.addTab({ title: 'Test 2', path: '/2' })
      templateManager.saveTemplate({ name: '模板2' })

      const templates = templateManager.getAllTemplates()

      expect(templates.length).toBe(2)
    })
  })
})

