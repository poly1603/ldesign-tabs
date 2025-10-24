/**
 * Vue 插件
 */

import type { App, Plugin } from 'vue'
import type { TabsConfig } from '../types'
import { useTabs } from './composables/useTabs'
import TabsContainer from './components/TabsContainer.vue'
import TabItem from './components/TabItem.vue'
import TabContextMenu from './components/TabContextMenu.vue'
import TabScrollButtons from './components/TabScrollButtons.vue'

// 插件选项
export interface TabsPluginOptions extends TabsConfig {
  /** 组件前缀 */
  prefix?: string
}

/**
 * 全局实例键
 */
export const TABS_INJECTION_KEY = Symbol('ldesign-tabs')

/**
 * Vue 插件
 */
export const TabsPlugin: Plugin = {
  install(app: App, options: TabsPluginOptions = {}) {
    const { prefix = 'LdTabs', ...config } = options

    // 注册组件
    app.component(`${prefix}Container`, TabsContainer)
    app.component(`${prefix}Item`, TabItem)
    app.component(`${prefix}ContextMenu`, TabContextMenu)
    app.component(`${prefix}ScrollButtons`, TabScrollButtons)

    // 提供全局配置
    app.provide(TABS_INJECTION_KEY, config)

    // 全局属性（可选）
    if (!app.config.globalProperties.$tabs) {
      const router = (app.config.globalProperties.$router || app.config.globalProperties.$route?.router)
      const tabs = useTabs(config, router)
      app.config.globalProperties.$tabs = tabs
    }
  },
}

/**
 * 默认导出插件
 */
export default TabsPlugin











