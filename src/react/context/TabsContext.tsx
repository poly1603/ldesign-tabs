/**
 * React Context - TabsContext
 * 
 * 提供全局的标签页状态管理，使用 React Context API。
 * 允许在组件树中任意位置访问标签页状态和操作方法。
 * 
 * @example
 * ```tsx
 * import { TabsProvider, useTabsContext } from '@ldesign/tabs/react'
 * 
 * function App() {
 *   return (
 *     <TabsProvider config={{ maxTabs: 10 }}>
 *       <TabsUI />
 *     </TabsProvider>
 *   )
 * }
 * 
 * function TabsUI() {
 *   const { tabs, activeTabId, addTab } = useTabsContext()
 *   
 *   return (
 *     <div>
 *       {tabs.map(tab => <div key={tab.id}>{tab.title}</div>)}
 *       <button onClick={() => addTab({ title: '新标签', path: '/new' })}>
 *         添加
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */

import React, { createContext, useContext } from 'react'
import type { UseTabsReturn } from '../hooks/useTabs'

/**
 * TabsContext 类型
 */
export type TabsContextValue = UseTabsReturn | null

/**
 * Tabs Context
 */
export const TabsContext = createContext<TabsContextValue>(null)

/**
 * useTabsContext Hook
 * 
 * 从 Context 中获取标签页状态和操作方法。
 * 必须在 TabsProvider 内部使用。
 * 
 * @returns TabsContext 值
 * @throws {Error} 如果在 TabsProvider 外部使用
 * 
 * @example
 * ```tsx
 * function TabsList() {
 *   const { tabs, activateTab } = useTabsContext()
 *   
 *   return (
 *     <ul>
 *       {tabs.map(tab => (
 *         <li key={tab.id} onClick={() => activateTab(tab.id)}>
 *           {tab.title}
 *         </li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useTabsContext(): UseTabsReturn {
  const context = useContext(TabsContext)
  
  if (!context) {
    throw new Error('useTabsContext must be used within TabsProvider')
  }
  
  return context
}


