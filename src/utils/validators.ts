/**
 * 验证函数
 */

import type { Tab, TabConfig } from '../types'

/**
 * 验证标签配置
 */
export function validateTabConfig(config: TabConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!config.title || typeof config.title !== 'string') {
    errors.push('标签标题不能为空')
  }

  if (!config.path || typeof config.path !== 'string') {
    errors.push('标签路径不能为空')
  }

  if (config.title && config.title.length > 100) {
    errors.push('标签标题长度不能超过100个字符')
  }

  if (config.path && config.path.length > 500) {
    errors.push('标签路径长度不能超过500个字符')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 验证标签ID
 */
export function validateTabId(id: string): boolean {
  return typeof id === 'string' && id.length > 0
}

/**
 * 验证标签列表
 */
export function validateTabs(tabs: Tab[]): boolean {
  if (!Array.isArray(tabs)) {
    return false
  }

  return tabs.every((tab) => {
    return (
      validateTabId(tab.id) &&
      typeof tab.title === 'string' &&
      typeof tab.path === 'string' &&
      typeof tab.pinned === 'boolean' &&
      typeof tab.closable === 'boolean'
    )
  })
}

/**
 * 验证路径格式
 */
export function validatePath(path: string): boolean {
  // 简单验证路径格式
  return typeof path === 'string' && path.startsWith('/')
}

/**
 * 清理标签配置
 */
export function sanitizeTabConfig(config: TabConfig): TabConfig {
  return {
    id: config.id,
    title: String(config.title || '').trim(),
    path: String(config.path || '').trim(),
    icon: config.icon ? String(config.icon).trim() : undefined,
    pinned: Boolean(config.pinned),
    closable: config.closable !== false,
    meta: config.meta && typeof config.meta === 'object' ? { ...config.meta } : undefined
  }
}

/**
 * 检查是否为有效的索引
 */
export function isValidIndex(index: number, length: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < length
}

/**
 * 检查标签是否可以关闭
 */
export function canCloseTab(tab: Tab, isActive: boolean): boolean {
  // 不可关闭的标签不能关闭
  if (!tab.closable) {
    return false
  }

  // 当前激活的标签不能关闭（根据用户需求 2a）
  if (isActive) {
    return false
  }

  return true
}

/**
 * 检查是否可以添加新标签（基于最大数量限制）
 */
export function canAddTab(currentCount: number, maxTabs: number): boolean {
  return currentCount < maxTabs
}

/**
 * 验证拖拽操作
 */
export function validateDrag(fromIndex: number, toIndex: number, tabs: Tab[]): {
  valid: boolean
  reason?: string
} {
  if (!isValidIndex(fromIndex, tabs.length)) {
    return { valid: false, reason: '源索引无效' }
  }

  if (!isValidIndex(toIndex, tabs.length)) {
    return { valid: false, reason: '目标索引无效' }
  }

  const fromTab = tabs[fromIndex]
  const pinnedCount = tabs.filter(t => t.pinned).length

  // 如果是固定标签，不能拖到非固定区域
  if (fromTab.pinned && toIndex >= pinnedCount) {
    return { valid: false, reason: '固定标签不能移动到非固定区域' }
  }

  // 如果不是固定标签，不能拖到固定区域
  if (!fromTab.pinned && toIndex < pinnedCount) {
    return { valid: false, reason: '非固定标签不能移动到固定区域' }
  }

  return { valid: true }
}


