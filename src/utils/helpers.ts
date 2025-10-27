/**
 * 工具函数集合
 * 
 * 提供标签页系统使用的各种工具函数，包括：
 * - 函数防抖和节流
 * - 对象深拷贝
 * - 快捷键处理
 * - 标签查找和过滤
 * - DOM 操作辅助
 * 
 * @module helpers
 */

import type { Tab } from '../types'

/**
 * 防抖函数
 * 
 * 创建一个防抖函数，在调用后延迟 delay 毫秒执行。
 * 如果在延迟期间再次调用，会重置延迟计时。
 * 
 * 使用场景：
 * - 输入框搜索（等待用户停止输入）
 * - 窗口大小调整（等待调整完成）
 * - 滚动事件（等待滚动停止）
 * 
 * @param fn - 要防抖的函数
 * @param delay - 延迟时间（毫秒）
 * @returns 防抖后的函数
 * 
 * @example
 * ```typescript
 * const searchTabs = debounce((keyword: string) => {
 *   console.log('搜索:', keyword)
 * }, 300)
 * 
 * // 连续调用只会执行最后一次
 * searchTabs('a')
 * searchTabs('ab')
 * searchTabs('abc') // 只有这次会在300ms后执行
 * ```
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
 * 
 * 创建一个节流函数，确保在指定时间间隔内最多执行一次。
 * 首次调用会立即执行，后续调用会被忽略直到时间间隔过去。
 * 
 * 使用场景：
 * - 滚动事件（控制触发频率）
 * - 鼠标移动事件
 * - 窗口大小调整（限制执行频率）
 * 
 * @param fn - 要节流的函数
 * @param delay - 时间间隔（毫秒）
 * @returns 节流后的函数
 * 
 * @example
 * ```typescript
 * const handleScroll = throttle(() => {
 *   console.log('滚动位置:', window.scrollY)
 * }, 100)
 * 
 * // 每100ms最多执行一次，即使连续触发滚动事件
 * window.addEventListener('scroll', handleScroll)
 * ```
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
 * 
 * 性能优化版本：
 * 1. 优先使用 structuredClone API（浏览器原生，性能最佳）
 * 2. 回退到 JSON 方法（兼容性好，但有限制）
 * 3. 最后使用递归方法（兼容所有情况）
 * 
 * @param obj - 要克隆的对象
 * @returns 克隆后的对象
 * 
 * @example
 * ```typescript
 * const original = { name: '标签', meta: { count: 1 } }
 * const cloned = deepClone(original)
 * cloned.meta.count = 2
 * console.log(original.meta.count) // 仍然是 1
 * ```
 */
export function deepClone<T>(obj: T): T {
  // 基本类型直接返回
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  // 性能优化：使用原生 structuredClone（Chrome 98+, Firefox 94+）
  // 这是最快的深拷贝方法，由浏览器原生实现
  if (typeof structuredClone !== 'undefined') {
    try {
      return structuredClone(obj)
    }
    catch {
      // 如果 structuredClone 失败（比如包含不可克隆的对象），继续使用下面的方法
    }
  }

  // 次优方案：使用 JSON 方法（快速但有限制：不支持函数、Symbol、undefined等）
  // 对于纯数据对象（如标签数据）这是最快的方法
  try {
    return JSON.parse(JSON.stringify(obj))
  }
  catch {
    // JSON 方法失败，使用递归方法
  }

  // 回退方案：递归克隆（兼容性最好，但性能较差）
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
 * 
 * 判断当前运行环境是否为 macOS 或 iOS 设备。
 * 用于实现跨平台的快捷键显示和行为适配。
 * 
 * @returns 如果是 Mac/iOS 设备返回 true，否则返回 false
 * 
 * @example
 * ```typescript
 * if (isMac()) {
 *   console.log('使用 Cmd 键')
 * } else {
 *   console.log('使用 Ctrl 键')
 * }
 * ```
 */
export function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/i.test(navigator.platform)
}

/**
 * 格式化快捷键显示
 * 
 * 将快捷键字符串转换为平台特定的符号显示。
 * 在 Mac 上会使用特殊符号（⌘ ⌥ ⇧），Windows 上保持原样。
 * 
 * @param shortcut - 快捷键字符串（如 "Ctrl+S"）
 * @returns 格式化后的快捷键显示
 * 
 * @example
 * ```typescript
 * // Mac: ⌘+S, Windows: Ctrl+S
 * const display = formatShortcut('Ctrl+S')
 * 
 * // Mac: ⌘+⇧+T, Windows: Ctrl+Shift+T
 * const display2 = formatShortcut('Ctrl+Shift+T')
 * ```
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
 * 解析快捷键事件
 * 
 * 判断键盘事件是否匹配指定的快捷键组合。
 * 自动适配 Mac（Cmd）和 Windows（Ctrl）平台差异。
 * 
 * @param event - 键盘事件对象
 * @param shortcut - 快捷键字符串（如 "Ctrl+W", "Ctrl+Shift+T"）
 * @returns 如果匹配返回 true，否则返回 false
 * 
 * @example
 * ```typescript
 * document.addEventListener('keydown', (e) => {
 *   if (parseShortcut(e, 'Ctrl+W')) {
 *     console.log('关闭标签')
 *     e.preventDefault()
 *   }
 *   
 *   if (parseShortcut(e, 'Ctrl+Shift+T')) {
 *     console.log('重新打开标签')
 *   }
 * })
 * ```
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
 * 截断标题文本
 * 
 * 将过长的标题截断并添加省略号（...）。
 * 用于在标签容器宽度有限时显示简短标题。
 * 
 * @param title - 原始标题文本
 * @param maxLength - 最大长度（默认20个字符）
 * @returns 截断后的标题
 * 
 * @example
 * ```typescript
 * truncateTitle('这是一个非常长的标签标题', 10)
 * // 返回: "这是一个非常..."
 * 
 * truncateTitle('短标题', 10)
 * // 返回: "短标题"
 * ```
 */
export function truncateTitle(title: string, maxLength: number = 20): string {
  if (title.length <= maxLength) {
    return title
  }
  return `${title.slice(0, maxLength - 3)}...`
}

/**
 * 从路径提取标题
 * 
 * 从 URL 路径中智能提取合适的标题。
 * 处理逻辑：
 * 1. 移除查询参数和哈希
 * 2. 提取路径的最后一段
 * 3. 将 kebab-case 转换为 Title Case
 * 4. 空路径返回"首页"
 * 
 * @param path - URL 路径字符串
 * @returns 提取的标题
 * 
 * @example
 * ```typescript
 * extractTitleFromPath('/')
 * // 返回: "首页"
 * 
 * extractTitleFromPath('/user-settings')
 * // 返回: "User Settings"
 * 
 * extractTitleFromPath('/admin/system-config?tab=general')
 * // 返回: "System Config"
 * ```
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
 * 
 * 通过比较路径判断两个标签是否指向同一页面。
 * 路径相同则认为是同一个标签。
 * 
 * @param tab1 - 第一个标签
 * @param tab2 - 第二个标签
 * @returns 如果是相同标签返回 true
 * 
 * @example
 * ```typescript
 * const tab1 = { id: '1', path: '/home', title: '首页' }
 * const tab2 = { id: '2', path: '/home', title: '主页' }
 * 
 * isSameTab(tab1, tab2) // true（路径相同）
 * ```
 */
export function isSameTab(tab1: Tab, tab2: Tab): boolean {
  return tab1.path === tab2.path
}

/**
 * 查找标签索引
 * 
 * 在标签数组中查找指定 ID 的标签位置。
 * 
 * @param tabs - 标签数组
 * @param tabId - 要查找的标签 ID
 * @returns 标签索引，未找到返回 -1
 * 
 * @example
 * ```typescript
 * const tabs = [
 *   { id: 'tab1', title: 'A' },
 *   { id: 'tab2', title: 'B' }
 * ]
 * 
 * findTabIndex(tabs, 'tab2') // 1
 * findTabIndex(tabs, 'tab3') // -1
 * ```
 */
export function findTabIndex(tabs: Tab[], tabId: string): number {
  return tabs.findIndex(tab => tab.id === tabId)
}

/**
 * 根据路径查找标签
 * 
 * 在标签数组中查找指定路径的标签对象。
 * 用于检测重复标签或查找已存在的标签。
 * 
 * @param tabs - 标签数组
 * @param path - 要查找的路径
 * @returns 找到的标签对象，未找到返回 undefined
 * 
 * @example
 * ```typescript
 * const tabs = [
 *   { id: '1', path: '/home', title: '首页' },
 *   { id: '2', path: '/about', title: '关于' }
 * ]
 * 
 * const tab = findTabByPath(tabs, '/home')
 * console.log(tab?.title) // "首页"
 * ```
 */
export function findTabByPath(tabs: Tab[], path: string): Tab | undefined {
  return tabs.find(tab => tab.path === path)
}

/**
 * 过滤固定标签
 * 
 * 从标签数组中筛选出所有固定（pinned）的标签。
 * 固定标签通常显示在标签栏的最前面，不能被随意关闭。
 * 
 * @param tabs - 标签数组
 * @returns 固定标签数组
 * 
 * @example
 * ```typescript
 * const pinnedTabs = filterPinnedTabs(tabs)
 * console.log(`有 ${pinnedTabs.length} 个固定标签`)
 * ```
 */
export function filterPinnedTabs(tabs: Tab[]): Tab[] {
  return tabs.filter(tab => tab.pinned)
}

/**
 * 过滤非固定标签
 * 
 * 从标签数组中筛选出所有非固定（未 pin）的标签。
 * 
 * @param tabs - 标签数组
 * @returns 非固定标签数组
 * 
 * @example
 * ```typescript
 * const unpinnedTabs = filterUnpinnedTabs(tabs)
 * console.log(`有 ${unpinnedTabs.length} 个普通标签`)
 * ```
 */
export function filterUnpinnedTabs(tabs: Tab[]): Tab[] {
  return tabs.filter(tab => !tab.pinned)
}

/**
 * 排序标签
 * 
 * 对标签数组进行排序，确保固定标签在前，普通标签在后。
 * 这是标签页系统的基本排序规则。
 * 
 * @param tabs - 待排序的标签数组
 * @returns 排序后的新数组（不修改原数组）
 * 
 * @example
 * ```typescript
 * const sorted = sortTabs(tabs)
 * // sorted 中固定标签在前面，普通标签在后面
 * ```
 */
export function sortTabs(tabs: Tab[]): Tab[] {
  const pinned = filterPinnedTabs(tabs)
  const unpinned = filterUnpinnedTabs(tabs)
  return [...pinned, ...unpinned]
}

/**
 * 生成唯一标签 ID
 * 
 * 生成一个唯一的标签标识符，格式为：`tab_时间戳_随机字符串`。
 * 使用时间戳和随机数组合保证唯一性。
 * 
 * @returns 唯一的标签 ID
 * 
 * @example
 * ```typescript
 * const id = generateId()
 * // 返回类似: "tab_1699887654321_k8m2x9p"
 * ```
 */
export function generateId(): string {
  return `tab_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 安全的 JSON 解析
 * 
 * 安全地将 JSON 字符串解析为对象。
 * 如果解析失败或输入为 null，返回默认值而不抛出异常。
 * 
 * @param json - 要解析的 JSON 字符串
 * @param defaultValue - 解析失败时的默认返回值
 * @returns 解析后的对象或默认值
 * 
 * @example
 * ```typescript
 * const data = safeJSONParse<User>('{"name":"张三"}', { name: '默认' })
 * // 成功返回: { name: "张三" }
 * 
 * const data2 = safeJSONParse<User>('invalid json', { name: '默认' })
 * // 失败返回: { name: "默认" }
 * ```
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
 * 
 * 安全地将对象转换为 JSON 字符串。
 * 如果转换失败（如循环引用），返回 null 而不抛出异常。
 * 
 * @param value - 要转换的值
 * @returns JSON 字符串，失败返回 null
 * 
 * @example
 * ```typescript
 * const json = safeJSONStringify({ name: '张三', age: 25 })
 * // 返回: '{"name":"张三","age":25}'
 * 
 * const circular = { a: 1 }
 * circular.self = circular
 * const json2 = safeJSONStringify(circular)
 * // 返回: null（循环引用无法序列化）
 * ```
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
 * 获取两个索引之间的标签
 * 
 * 提取标签数组中指定索引范围内的所有标签。
 * 自动处理索引顺序，无需确保 startIndex < endIndex。
 * 
 * @param tabs - 标签数组
 * @param startIndex - 起始索引（包含）
 * @param endIndex - 结束索引（包含）
 * @returns 范围内的标签数组
 * 
 * @example
 * ```typescript
 * const tabs = [tab1, tab2, tab3, tab4, tab5]
 * 
 * // 获取索引 1 到 3 的标签
 * const range = getTabsBetween(tabs, 1, 3)
 * // 返回: [tab2, tab3, tab4]
 * 
 * // 索引反向也可以
 * const range2 = getTabsBetween(tabs, 3, 1)
 * // 返回: [tab2, tab3, tab4]（结果相同）
 * ```
 */
export function getTabsBetween(tabs: Tab[], startIndex: number, endIndex: number): Tab[] {
  const start = Math.min(startIndex, endIndex)
  const end = Math.max(startIndex, endIndex)
  return tabs.slice(start, end + 1)
}

/**
 * 移动数组元素
 * 
 * 将数组中的元素从一个位置移动到另一个位置。
 * 返回新数组，不修改原数组。常用于拖拽排序操作。
 * 
 * @param arr - 原数组
 * @param fromIndex - 源位置索引
 * @param toIndex - 目标位置索引
 * @returns 移动后的新数组
 * 
 * @example
 * ```typescript
 * const tabs = ['A', 'B', 'C', 'D']
 * 
 * // 将索引 1 ('B') 移到索引 3
 * const result = moveArrayItem(tabs, 1, 3)
 * // 返回: ['A', 'C', 'D', 'B']
 * 
 * console.log(tabs) // ['A', 'B', 'C', 'D']（原数组不变）
 * ```
 */
export function moveArrayItem<T>(arr: T[], fromIndex: number, toIndex: number): T[] {
  const newArr = [...arr]
  const [item] = newArr.splice(fromIndex, 1)
  newArr.splice(toIndex, 0, item)
  return newArr
}

/**
 * 延迟执行
 * 
 * 返回一个 Promise，在指定毫秒数后 resolve。
 * 可用于异步延迟、动画等待等场景。
 * 
 * @param ms - 延迟时间（毫秒）
 * @returns Promise 对象
 * 
 * @example
 * ```typescript
 * // 在异步函数中使用
 * async function demo() {
 *   console.log('开始')
 *   await sleep(1000) // 等待 1 秒
 *   console.log('1秒后执行')
 * }
 * 
 * // 顺序执行动画
 * await sleep(300)
 * element.classList.add('fade-out')
 * ```
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 判断元素是否在视口内
 * 
 * 检测 HTML 元素是否完全在浏览器可视区域内。
 * 用于判断元素是否需要滚动才能看到。
 * 
 * @param el - 要检测的 HTML 元素
 * @returns 如果完全在视口内返回 true，否则返回 false
 * 
 * @example
 * ```typescript
 * const tabElement = document.querySelector('.tab')
 * 
 * if (!isElementInViewport(tabElement)) {
 *   // 元素不在视口内，需要滚动
 *   tabElement.scrollIntoView()
 * }
 * ```
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
 * 滚动元素到视口内（如果需要）
 * 
 * 智能滚动：仅在元素不在视口内时才执行滚动。
 * 支持滚动到指定容器内或页面视口内。
 * 
 * 使用场景：
 * - 激活标签时自动滚动到可见位置
 * - 搜索结果高亮后滚动到目标
 * - 确保焦点元素可见
 * 
 * @param el - 要滚动到的元素
 * @param container - 可选的滚动容器（默认为页面）
 * 
 * @example
 * ```typescript
 * // 滚动到页面视口内（平滑滚动）
 * scrollIntoViewIfNeeded(activeTab)
 * 
 * // 滚动到指定容器内
 * const tabsContainer = document.querySelector('.tabs-container')
 * scrollIntoViewIfNeeded(activeTab, tabsContainer)
 * 
 * // 使用案例：激活标签时
 * function activateTab(tabId: string) {
 *   const tab = findTab(tabId)
 *   const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`)
 *   scrollIntoViewIfNeeded(tabElement, tabsContainer)
 * }
 * ```
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


