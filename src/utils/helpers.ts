/**
 * 工具函数
 */

import type { Tab } from '../types'

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args)
      timeoutId = null
    }, delay)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastTime = 0

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()

    if (now - lastTime >= delay) {
      fn.apply(this, args)
      lastTime = now
    }
  }
}

/**
 * 深度克隆对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as any
  }

  if (obj instanceof Object) {
    const clonedObj = {} as T
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }

  return obj
}

/**
 * 检测是否为 Mac 系统
 */
export function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/i.test(navigator.platform)
}

/**
 * 格式化快捷键显示
 */
export function formatShortcut(shortcut: string): string {
  if (isMac()) {
    return shortcut
      .replace(/Ctrl/g, '⌘')
      .replace(/Alt/g, '⌥')
      .replace(/Shift/g, '⇧')
  }
  return shortcut
}

/**
 * 解析快捷键
 */
export function parseShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const keys = shortcut.toLowerCase().split('+')
  const ctrl = keys.includes('ctrl') || keys.includes('cmd')
  const alt = keys.includes('alt')
  const shift = keys.includes('shift')
  const key = keys[keys.length - 1]

  const ctrlPressed = isMac() ? event.metaKey : event.ctrlKey
  const altPressed = event.altKey
  const shiftPressed = event.shiftKey
  const keyPressed = event.key.toLowerCase()

  return (
    (!ctrl || ctrlPressed) &&
    (!alt || altPressed) &&
    (!shift || shiftPressed) &&
    (keyPressed === key || event.code.toLowerCase() === key)
  )
}

/**
 * 计算标签的显示标题（超长截断）
 */
export function truncateTitle(title: string, maxLength: number = 20): string {
  if (title.length <= maxLength) {
    return title
  }
  return `${title.slice(0, maxLength - 3)}...`
}

/**
 * 从路径提取标题
 */
export function extractTitleFromPath(path: string): string {
  // 移除查询参数和hash
  const cleanPath = path.split('?')[0].split('#')[0]

  // 分割路径
  const segments = cleanPath.split('/').filter(Boolean)

  // 返回最后一个段，如果没有则返回"首页"
  if (segments.length === 0) {
    return '首页'
  }

  const lastSegment = segments[segments.length - 1]

  // 将 kebab-case 转换为 Title Case
  return lastSegment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * 比较两个标签是否相同
 */
export function isSameTab(tab1: Tab, tab2: Tab): boolean {
  return tab1.path === tab2.path
}

/**
 * 查找标签索引
 */
export function findTabIndex(tabs: Tab[], tabId: string): number {
  return tabs.findIndex(tab => tab.id === tabId)
}

/**
 * 查找标签通过路径
 */
export function findTabByPath(tabs: Tab[], path: string): Tab | undefined {
  return tabs.find(tab => tab.path === path)
}

/**
 * 过滤固定标签
 */
export function filterPinnedTabs(tabs: Tab[]): Tab[] {
  return tabs.filter(tab => tab.pinned)
}

/**
 * 过滤非固定标签
 */
export function filterUnpinnedTabs(tabs: Tab[]): Tab[] {
  return tabs.filter(tab => !tab.pinned)
}

/**
 * 排序标签（固定的在前）
 */
export function sortTabs(tabs: Tab[]): Tab[] {
  const pinned = filterPinnedTabs(tabs)
  const unpinned = filterUnpinnedTabs(tabs)
  return [...pinned, ...unpinned]
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `tab_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 安全的 JSON 解析
 */
export function safeJSONParse<T>(json: string | null, defaultValue: T): T {
  if (!json) {
    return defaultValue
  }

  try {
    return JSON.parse(json) as T
  }
  catch {
    return defaultValue
  }
}

/**
 * 安全的 JSON 字符串化
 */
export function safeJSONStringify(value: any): string | null {
  try {
    return JSON.stringify(value)
  }
  catch {
    return null
  }
}

/**
 * 计算两个索引之间的标签
 */
export function getTabsBetween(tabs: Tab[], startIndex: number, endIndex: number): Tab[] {
  const start = Math.min(startIndex, endIndex)
  const end = Math.max(startIndex, endIndex)
  return tabs.slice(start, end + 1)
}

/**
 * 移动数组元素
 */
export function moveArrayItem<T>(arr: T[], fromIndex: number, toIndex: number): T[] {
  const newArr = [...arr]
  const [item] = newArr.splice(fromIndex, 1)
  newArr.splice(toIndex, 0, item)
  return newArr
}

/**
 * 延迟执行
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 判断元素是否在视口内
 */
export function isElementInViewport(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

/**
 * 滚动元素到视口内
 */
export function scrollIntoViewIfNeeded(el: HTMLElement, container?: HTMLElement): void {
  if (isElementInViewport(el)) {
    return
  }

  if (container) {
    const containerRect = container.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()

    if (elRect.left < containerRect.left) {
      container.scrollLeft -= containerRect.left - elRect.left
    }
    else if (elRect.right > containerRect.right) {
      container.scrollLeft += elRect.right - containerRect.right
    }
  }
  else {
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }
}


