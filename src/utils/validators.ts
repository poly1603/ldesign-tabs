/**
 * 验证函数集合
 * 
 * 提供标签页系统所需的各种验证功能，包括：
 * - 标签配置验证
 * - 数据格式验证
 * - 操作权限验证
 * - 数据清理和规范化
 * 
 * 所有验证函数都遵循"严格输入、宽松输出"的原则，
 * 在输入时进行严格检查，确保数据的完整性和一致性。
 * 
 * @module validators
 */

import type { Tab, TabConfig } from '../types'

/**
 * 验证标签配置
 * 
 * 对标签配置对象进行全面验证，检查必填字段和数据格式。
 * 返回验证结果和错误信息列表。
 * 
 * 验证规则：
 * - title: 必填，字符串类型，长度不超过100字符
 * - path: 必填，字符串类型，长度不超过500字符
 * - icon: 可选
 * - pinned: 可选，布尔类型
 * - closable: 可选，布尔类型
 * 
 * @param config - 待验证的标签配置对象
 * @returns 验证结果对象，包含 valid 状态和 errors 错误列表
 * 
 * @example
 * ```typescript
 * const config = { title: '首页', path: '/' }
 * const result = validateTabConfig(config)
 * 
 * if (result.valid) {
 *   manager.addTab(config)
 * } else {
 *   console.error('验证失败:', result.errors)
 * }
 * 
 * // 验证失败的例子
 * const invalid = { title: '', path: '/' }
 * const result2 = validateTabConfig(invalid)
 * // result2.errors: ['标签标题不能为空']
 * ```
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
 * 
 * 检查标签ID是否有效。
 * 有效的ID必须是非空字符串。
 * 
 * @param id - 要验证的标签ID
 * @returns 如果ID有效返回 true，否则返回 false
 * 
 * @example
 * ```typescript
 * validateTabId('tab_123') // true
 * validateTabId('') // false
 * validateTabId(null) // false
 * validateTabId(123) // false（必须是字符串）
 * ```
 */
export function validateTabId(id: string): boolean {
  return typeof id === 'string' && id.length > 0
}

/**
 * 验证标签列表
 * 
 * 检查标签数组是否有效，验证每个标签的必填字段。
 * 用于验证从存储恢复的数据或外部导入的数据。
 * 
 * @param tabs - 要验证的标签数组
 * @returns 如果所有标签都有效返回 true，否则返回 false
 * 
 * @example
 * ```typescript
 * const tabs = [
 *   { id: '1', title: 'A', path: '/a', pinned: false, closable: true },
 *   { id: '2', title: 'B', path: '/b', pinned: false, closable: true }
 * ]
 * 
 * if (validateTabs(tabs)) {
 *   console.log('标签列表有效')
 * } else {
 *   console.error('标签列表包含无效数据')
 * }
 * ```
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
 * 
 * 检查路径字符串是否符合要求。
 * 目前要求路径必须以 '/' 开头（符合前端路由规范）。
 * 
 * @param path - 要验证的路径字符串
 * @returns 如果路径格式有效返回 true，否则返回 false
 * 
 * @example
 * ```typescript
 * validatePath('/home') // true
 * validatePath('/users/123') // true
 * validatePath('home') // false（必须以/开头）
 * validatePath('') // false
 * ```
 */
export function validatePath(path: string): boolean {
  // 简单验证路径格式
  return typeof path === 'string' && path.startsWith('/')
}

/**
 * 清理标签配置
 * 
 * 规范化和清理标签配置对象，确保数据格式正确。
 * 处理逻辑：
 * - 字符串类型字段：去除首尾空格
 * - 布尔类型字段：转换为布尔值
 * - closable：默认为 true
 * - meta：深拷贝对象，防止引用污染
 * 
 * @param config - 待清理的标签配置
 * @returns 清理后的标签配置
 * 
 * @example
 * ```typescript
 * const config = {
 *   title: '  首页  ',
 *   path: '/home ',
 *   icon: ' 🏠 ',
 *   pinned: 1, // 非布尔值
 *   meta: { color: 'blue' }
 * }
 * 
 * const cleaned = sanitizeTabConfig(config)
 * // {
 * //   title: '首页',
 * //   path: '/home',
 * //   icon: '🏠',
 * //   pinned: true,
 * //   closable: true,
 * //   meta: { color: 'blue' }
 * // }
 * ```
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
 * 检查是否为有效的数组索引
 * 
 * 验证给定的索引是否在数组范围内。
 * 
 * @param index - 要验证的索引
 * @param length - 数组长度
 * @returns 如果索引有效返回 true，否则返回 false
 * 
 * @example
 * ```typescript
 * const tabs = ['A', 'B', 'C']
 * 
 * isValidIndex(0, tabs.length) // true
 * isValidIndex(2, tabs.length) // true
 * isValidIndex(3, tabs.length) // false（超出范围）
 * isValidIndex(-1, tabs.length) // false（负数）
 * isValidIndex(1.5, tabs.length) // false（非整数）
 * ```
 */
export function isValidIndex(index: number, length: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < length
}

/**
 * 检查标签是否可以关闭
 * 
 * 根据标签的 closable 属性和激活状态判断是否可以关闭。
 * 
 * 关闭规则：
 * 1. 如果标签的 closable 为 false，不能关闭
 * 2. 如果标签是当前激活的标签，不能关闭（防止关闭正在使用的标签）
 * 3. 其他情况可以关闭
 * 
 * @param tab - 要检查的标签对象
 * @param isActive - 是否为当前激活的标签
 * @returns 如果可以关闭返回 true，否则返回 false
 * 
 * @example
 * ```typescript
 * const homeTab = { closable: false, ... }
 * canCloseTab(homeTab, false) // false（不可关闭的标签）
 * 
 * const activeTab = { closable: true, ... }
 * canCloseTab(activeTab, true) // false（当前激活的标签）
 * 
 * const normalTab = { closable: true, ... }
 * canCloseTab(normalTab, false) // true（可以关闭）
 * ```
 */
export function canCloseTab(tab: Tab, isActive: boolean): boolean {
  // 不可关闭的标签不能关闭
  if (!tab.closable) {
    return false
  }

  // 当前激活的标签不能关闭
  if (isActive) {
    return false
  }

  return true
}

/**
 * 检查是否可以添加新标签
 * 
 * 根据最大数量限制判断是否还能添加更多标签。
 * 防止标签数量无限增长，保持良好的用户体验。
 * 
 * @param currentCount - 当前标签数量
 * @param maxTabs - 允许的最大标签数量
 * @returns 如果可以添加返回 true，否则返回 false
 * 
 * @example
 * ```typescript
 * // 假设最大10个标签
 * canAddTab(8, 10) // true（还可以添加2个）
 * canAddTab(10, 10) // false（已达上限）
 * canAddTab(15, 10) // false（超出限制）
 * ```
 */
export function canAddTab(currentCount: number, maxTabs: number): boolean {
  return currentCount < maxTabs
}

/**
 * 验证拖拽操作
 * 
 * 验证标签拖拽操作是否合法。
 * 
 * 验证规则：
 * 1. 源索引和目标索引必须在有效范围内
 * 2. 固定标签不能拖拽到非固定区域
 * 3. 非固定标签不能拖拽到固定区域
 * 
 * 这些规则确保固定标签区域和普通标签区域的隔离。
 * 
 * @param fromIndex - 拖拽源索引
 * @param toIndex - 拖拽目标索引
 * @param tabs - 标签数组
 * @returns 验证结果对象，包含 valid 状态和 reason 原因
 * 
 * @example
 * ```typescript
 * const tabs = [
 *   { id: '1', pinned: true },  // 索引0，固定
 *   { id: '2', pinned: true },  // 索引1，固定
 *   { id: '3', pinned: false }, // 索引2，普通
 *   { id: '4', pinned: false }  // 索引3，普通
 * ]
 * 
 * // 固定标签之间可以拖拽
 * validateDrag(0, 1, tabs)
 * // { valid: true }
 * 
 * // 固定标签不能拖到普通区域
 * validateDrag(0, 3, tabs)
 * // { valid: false, reason: '固定标签不能移动到非固定区域' }
 * 
 * // 普通标签不能拖到固定区域
 * validateDrag(3, 0, tabs)
 * // { valid: false, reason: '非固定标签不能移动到固定区域' }
 * ```
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


