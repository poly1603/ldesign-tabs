/**
 * React 集成导出
 * 
 * 提供完整的 React 支持，包括：
 * - Hooks（useTabs, useTabManager, useTabDrag）
 * - 组件（TabsContainer, TabItem, TabContextMenu）
 * - Context（TabsProvider, useTabsContext）
 * 
 * @example
 * ```tsx
 * import { TabsProvider, useTabs, TabsContainer } from '@ldesign/tabs/react'
 * import '@ldesign/tabs/styles'
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
 *   const { tabs, activeTabId, activateTab, removeTab } = useTabsContext()
 *   
 *   return (
 *     <TabsContainer
 *       tabs={tabs}
 *       activeTabId={activeTabId}
 *       onTabClick={(tab) => activateTab(tab.id)}
 *       onTabClose={(tab) => removeTab(tab.id)}
 *     />
 *   )
 * }
 * ```
 */

// Hooks
export * from './hooks'

// Components
export * from './components'

// Context
export * from './context/TabsContext'
export * from './provider/TabsProvider'


