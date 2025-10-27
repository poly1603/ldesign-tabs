/**
 * React Provider - TabsProvider
 * 
 * 提供标签页状态的全局 Provider 组件。
 * 使用此 Provider 包裹应用，可以在任意子组件中访问标签页状态。
 * 
 * @example
 * ```tsx
 * import { TabsProvider } from '@ldesign/tabs/react'
 * 
 * function App() {
 *   return (
 *     <TabsProvider config={{ maxTabs: 10, persist: true }}>
 *       <Layout />
 *     </TabsProvider>
 *   )
 * }
 * ```
 */

import React, { type ReactNode } from 'react'
import { useTabs, type UseTabsConfig } from '../hooks/useTabs'
import { TabsContext } from '../context/TabsContext'

/**
 * TabsProvider Props
 */
export interface TabsProviderProps {
  /** 子组件 */
  children: ReactNode
  /** 标签管理器配置 */
  config?: UseTabsConfig
}

/**
 * TabsProvider 组件
 * 
 * 全局标签页状态提供者。
 * 
 * @example
 * ```tsx
 * import { TabsProvider, useTabsContext } from '@ldesign/tabs/react'
 * 
 * function App() {
 *   return (
 *     <TabsProvider
 *       config={{
 *         maxTabs: 15,
 *         persist: true,
 *         persistKey: 'my-app-tabs',
 *         defaultTabs: [
 *           { title: '首页', path: '/' }
 *         ]
 *       }}
 *     >
 *       <Header />
 *       <Content />
 *     </TabsProvider>
 *   )
 * }
 * 
 * function Header() {
 *   const { tabs, activeTab } = useTabsContext()
 *   return <h1>当前: {activeTab?.title}</h1>
 * }
 * 
 * function Content() {
 *   const { addTab, removeTab } = useTabsContext()
 *   return (
 *     <button onClick={() => addTab({ title: '新标签', path: '/new' })}>
 *       添加标签
 *     </button>
 *   )
 * }
 * ```
 */
export function TabsProvider({ children, config = {} }: TabsProviderProps) {
  const tabsState = useTabs(config)

  return (
    <TabsContext.Provider value={tabsState}>
      {children}
    </TabsContext.Provider>
  )
}


