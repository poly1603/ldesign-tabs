/**
 * React Hooks - useTabManager
 * 
 * 轻量级的标签管理器 Hook，直接使用核心 TabManager。
 * 适合需要完全控制管理器行为的高级场景。
 * 
 * @example
 * ```tsx
 * import { useTabManager } from '@ldesign/tabs/react'
 * 
 * function App() {
 *   const manager = useTabManager({
 *     maxTabs: 10,
 *     persist: true
 *   })
 * 
 *   const handleAddTab = () => {
 *     manager.addTab({
 *       title: '新标签',
 *       path: '/new'
 *     })
 *   }
 * 
 *   return <button onClick={handleAddTab}>添加标签</button>
 * }
 * ```
 */

import { useEffect, useRef } from 'react'
import type { TabManagerConfig } from '../../types'
import { createTabManager, type TabManager } from '../../core'

/**
 * useTabManager Hook
 * 
 * 创建并管理 TabManager 实例的生命周期。
 * 
 * @param config - 标签管理器配置
 * @returns TabManager 实例
 * 
 * @example
 * ```tsx
 * function CustomTabsComponent() {
 *   const manager = useTabManager({
 *     maxTabs: 15,
 *     persist: true,
 *     persistKey: 'my-app-tabs'
 *   })
 * 
 *   // 使用管理器
 *   manager.addTab({ title: '首页', path: '/' })
 *   
 *   return <div>Custom implementation...</div>
 * }
 * ```
 */
export function useTabManager(config: TabManagerConfig = {}): TabManager {
  const managerRef = useRef<TabManager>()

  // 只创建一次
  if (!managerRef.current) {
    managerRef.current = createTabManager(config)
  }

  const manager = managerRef.current

  // 清理资源
  useEffect(() => {
    return () => {
      manager.destroy()
    }
  }, [manager])

  return manager
}


