/**
 * Vue 集成导出
 */

export { useTabs } from './composables/useTabs'
export type { UseTabsReturn } from './composables/useTabs'

export { default as TabsPlugin, TABS_INJECTION_KEY } from './plugin'
export type { TabsPluginOptions } from './plugin'

export { default as TabsContainer } from './components/TabsContainer.vue'
export { default as TabItem } from './components/TabItem.vue'
export { default as TabContextMenu } from './components/TabContextMenu.vue'
export { default as TabScrollButtons } from './components/TabScrollButtons.vue'











