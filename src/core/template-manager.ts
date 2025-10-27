/**
 * 标签模板管理器
 * 
 * 提供标签模板的创建、保存、加载和管理功能。
 * 模板可以快速恢复常用的标签页组合，提高工作效率。
 * 
 * 主要功能：
 * - 保存当前标签组合为模板
 * - 加载模板快速恢复工作区
 * - 模板的导入/导出（JSON格式）
 * - 模板的增删改查
 * - 模板持久化存储
 * 
 * @example
 * ```typescript
 * const templateManager = new TemplateManager(tabManager, storage)
 * 
 * // 保存当前标签为模板
 * const template = templateManager.saveTemplate({
 *   name: '开发环境',
 *   description: '常用的开发标签'
 * })
 * 
 * // 加载模板
 * templateManager.loadTemplate(template.id)
 * ```
 */

import { nanoid } from 'nanoid'
import type { TabEventEmitter, TabStorage, TabTemplate, TabTemplateConfig } from '../types'
import type { TabManager } from './manager'
import { deepClone } from '../utils'

/**
 * 模板管理器类
 */
export class TemplateManager {
  /** 模板列表 */
  private templates: TabTemplate[] = []

  /** 标签管理器引用 */
  private tabManager: TabManager

  /** 存储适配器 */
  private storage: TabStorage

  /** 事件发射器 */
  private get events(): TabEventEmitter {
    return this.tabManager.events
  }

  /**
   * 构造函数
   * 
   * @param tabManager - 标签管理器实例
   * @param storage - 存储适配器实例
   * 
   * @example
   * ```typescript
   * const templateManager = new TemplateManager(tabManager, storage)
   * ```
   */
  constructor(tabManager: TabManager, storage: TabStorage) {
    this.tabManager = tabManager
    this.storage = storage
    this.loadFromStorage()
  }

  /**
   * 保存当前标签为模板
   * 
   * 将当前打开的所有标签保存为一个模板，方便以后快速恢复。
   * 模板会包含标签的标题、路径、图标、固定状态等信息。
   * 
   * @param config - 模板配置（名称和描述）
   * @returns 创建的模板对象
   * 
   * @example
   * ```typescript
   * const template = templateManager.saveTemplate({
   *   name: '开发环境',
   *   description: '包含代码编辑器、API文档、数据库管理等标签'
   * })
   * 
   * console.log(`模板已保存，ID: ${template.id}`)
   * ```
   */
  saveTemplate(config: TabTemplateConfig): TabTemplate {
    const template: TabTemplate = {
      id: nanoid(),
      name: config.name,
      description: config.description,
      tabs: this.tabManager.getAllTabs().map(tab => ({
        title: tab.title,
        path: tab.path,
        icon: tab.icon,
        pinned: tab.pinned,
        meta: tab.meta,
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    this.templates.push(template)

    // 触发事件
    this.events.emit({
      type: 'template:save',
      timestamp: Date.now(),
      template: deepClone(template),
    })

    // 持久化
    this.saveToStorage()

    return deepClone(template)
  }

  /**
   * 加载模板
   * 
   * 根据模板ID加载对应的标签组合，清除当前标签并打开模板中的所有标签。
   * 
   * @param id - 模板ID
   * @param options - 加载选项
   * @param options.clearCurrent - 是否清除当前标签（默认true）
   * @returns 加载成功返回true，失败返回false
   * 
   * @example
   * ```typescript
   * // 替换当前标签
   * templateManager.loadTemplate('template_123')
   * 
   * // 在当前标签基础上添加
   * templateManager.loadTemplate('template_123', { clearCurrent: false })
   * ```
   */
  loadTemplate(id: string, options: { clearCurrent?: boolean } = {}): boolean {
    const template = this.templates.find(t => t.id === id)
    if (!template) {
      return false
    }

    const { clearCurrent = true } = options

    // 清除当前标签
    if (clearCurrent) {
      this.tabManager.closeAllTabs()
    }

    // 添加模板中的标签
    template.tabs.forEach((tabConfig) => {
      this.tabManager.addTab(tabConfig)
    })

    // 更新模板使用时间
    template.lastUsedAt = Date.now()
    this.saveToStorage()

    // 触发事件
    this.events.emit({
      type: 'template:load',
      timestamp: Date.now(),
      template: deepClone(template),
    })

    return true
  }

  /**
   * 更新模板
   * 
   * 更新模板的名称或描述，或者更新模板的标签内容。
   * 
   * @param id - 模板ID
   * @param updates - 要更新的字段
   * @returns 更新成功返回true，失败返回false
   * 
   * @example
   * ```typescript
   * // 更新名称和描述
   * templateManager.updateTemplate('template_123', {
   *   name: '新名称',
   *   description: '新描述'
   * })
   * 
   * // 更新模板内容（使用当前标签）
   * templateManager.updateTemplate('template_123', {
   *   tabs: tabManager.getAllTabs()
   * })
   * ```
   */
  updateTemplate(id: string, updates: Partial<Omit<TabTemplate, 'id' | 'createdAt'>>): boolean {
    const template = this.templates.find(t => t.id === id)
    if (!template) {
      return false
    }

    const oldTemplate = deepClone(template)

    Object.assign(template, updates, {
      id: template.id,
      createdAt: template.createdAt,
      updatedAt: Date.now(),
    })

    // 触发事件
    this.events.emit({
      type: 'template:update',
      timestamp: Date.now(),
      template: deepClone(template),
      oldTemplate,
    })

    // 持久化
    this.saveToStorage()

    return true
  }

  /**
   * 删除模板
   * 
   * 根据ID删除指定的模板。
   * 
   * @param id - 模板ID
   * @returns 删除成功返回true，失败返回false
   * 
   * @example
   * ```typescript
   * templateManager.deleteTemplate('template_123')
   * ```
   */
  deleteTemplate(id: string): boolean {
    const index = this.templates.findIndex(t => t.id === id)
    if (index === -1) {
      return false
    }

    const template = this.templates[index]
    this.templates.splice(index, 1)

    // 触发事件
    this.events.emit({
      type: 'template:delete',
      timestamp: Date.now(),
      template: deepClone(template),
    })

    // 持久化
    this.saveToStorage()

    return true
  }

  /**
   * 获取单个模板
   * 
   * @param id - 模板ID
   * @returns 模板对象，未找到返回undefined
   */
  getTemplate(id: string): TabTemplate | undefined {
    const template = this.templates.find(t => t.id === id)
    return template ? deepClone(template) : undefined
  }

  /**
   * 获取所有模板
   * 
   * @returns 模板数组
   * 
   * @example
   * ```typescript
   * const templates = templateManager.getAllTemplates()
   * console.log(`共有 ${templates.length} 个模板`)
   * ```
   */
  getAllTemplates(): TabTemplate[] {
    return this.templates.map(template => deepClone(template))
  }

  /**
   * 导出模板为 JSON
   * 
   * 将模板导出为JSON格式，可以分享给其他用户或备份。
   * 
   * @param id - 模板ID
   * @returns JSON 字符串，失败返回null
   * 
   * @example
   * ```typescript
   * const json = templateManager.exportTemplate('template_123')
   * if (json) {
   *   // 保存到文件或复制到剪贴板
   *   navigator.clipboard.writeText(json)
   * }
   * ```
   */
  exportTemplate(id: string): string | null {
    const template = this.templates.find(t => t.id === id)
    if (!template) {
      return null
    }

    try {
      return JSON.stringify(template, null, 2)
    }
    catch {
      return null
    }
  }

  /**
   * 从 JSON 导入模板
   * 
   * 从JSON字符串导入模板，可以是从文件读取或从剪贴板粘贴。
   * 
   * @param json - JSON 字符串
   * @returns 导入成功返回模板对象，失败返回null
   * 
   * @example
   * ```typescript
   * const json = await navigator.clipboard.readText()
   * const template = templateManager.importTemplate(json)
   * 
   * if (template) {
   *   console.log('模板导入成功:', template.name)
   * } else {
   *   console.error('导入失败，JSON格式错误')
   * }
   * ```
   */
  importTemplate(json: string): TabTemplate | null {
    try {
      const template = JSON.parse(json) as TabTemplate

      // 验证模板格式
      if (!template.name || !Array.isArray(template.tabs)) {
        return null
      }

      // 生成新ID（避免冲突）
      template.id = nanoid()
      template.createdAt = Date.now()
      template.updatedAt = Date.now()

      this.templates.push(template)

      // 触发事件
      this.events.emit({
        type: 'template:import',
        timestamp: Date.now(),
        template: deepClone(template),
      })

      // 持久化
      this.saveToStorage()

      return deepClone(template)
    }
    catch {
      return null
    }
  }

  /**
   * 批量导出所有模板
   * 
   * @returns JSON 字符串
   * 
   * @example
   * ```typescript
   * const json = templateManager.exportAllTemplates()
   * // 保存到文件
   * const blob = new Blob([json], { type: 'application/json' })
   * const url = URL.createObjectURL(blob)
   * // 触发下载...
   * ```
   */
  exportAllTemplates(): string {
    return JSON.stringify(this.templates, null, 2)
  }

  /**
   * 批量导入模板
   * 
   * @param json - JSON 字符串（模板数组）
   * @returns 导入的模板数量
   * 
   * @example
   * ```typescript
   * const json = await readFileAsText(file)
   * const count = templateManager.importAllTemplates(json)
   * console.log(`成功导入 ${count} 个模板`)
   * ```
   */
  importAllTemplates(json: string): number {
    try {
      const templates = JSON.parse(json) as TabTemplate[]

      if (!Array.isArray(templates)) {
        return 0
      }

      let count = 0

      templates.forEach((template) => {
        if (template.name && Array.isArray(template.tabs)) {
          // 生成新ID
          template.id = nanoid()
          template.createdAt = Date.now()
          template.updatedAt = Date.now()

          this.templates.push(template)
          count++
        }
      })

      if (count > 0) {
        this.saveToStorage()

        // 触发事件
        this.events.emit({
          type: 'template:import-batch',
          timestamp: Date.now(),
          count,
        })
      }

      return count
    }
    catch {
      return 0
    }
  }

  /**
   * 从存储加载模板
   */
  private loadFromStorage(): void {
    const stored = this.storage.loadTemplates()
    if (stored && stored.templates && Array.isArray(stored.templates)) {
      this.templates = stored.templates
    }
  }

  /**
   * 保存模板到存储
   */
  private saveToStorage(): void {
    this.storage.saveTemplates({
      templates: this.templates,
      timestamp: Date.now(),
    })
  }

  /**
   * 清除所有模板
   * 
   * @example
   * ```typescript
   * templateManager.clearAllTemplates()
   * ```
   */
  clearAllTemplates(): void {
    this.templates = []
    this.saveToStorage()

    this.events.emit({
      type: 'template:clear-all',
      timestamp: Date.now(),
    })
  }

  /**
   * 销毁模板管理器
   */
  destroy(): void {
    this.templates = []
  }
}

/**
 * 创建模板管理器
 * 
 * @param tabManager - 标签管理器实例
 * @param storage - 存储适配器实例
 * @returns 模板管理器实例
 * 
 * @example
 * ```typescript
 * const templateManager = createTemplateManager(tabManager, storage)
 * ```
 */
export function createTemplateManager(tabManager: TabManager, storage: TabStorage): TemplateManager {
  return new TemplateManager(tabManager, storage)
}


