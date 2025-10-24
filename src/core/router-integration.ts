/**
 * 路由集成
 */

import type { RouterConfig, TabConfig } from '../types'
import { extractTitleFromPath } from '../utils'
import type { TabManager } from './manager'

/**
 * 默认路由配置
 */
const DEFAULT_ROUTER_CONFIG: Required<RouterConfig> = {
  autoSync: true,
  getTabTitle: (route: any) => {
    return route.meta?.title || route.meta?.titleKey || extractTitleFromPath(route.path)
  },
  getTabIcon: (route: any) => {
    return route.meta?.icon
  },
  shouldCreateTab: (route: any) => {
    // 默认排除 blank 布局的页面
    return route.meta?.layout !== 'blank'
  },
  shouldPinTab: (route: any) => {
    return route.meta?.pinTab === true
  },
}

/**
 * 路由集成处理器
 */
export class RouterIntegration {
  private config: Required<RouterConfig>
  private manager: TabManager
  private router: any
  private unwatch: (() => void) | null = null

  constructor(manager: TabManager, router: any, config: RouterConfig = {}) {
    this.manager = manager
    this.router = router
    this.config = { ...DEFAULT_ROUTER_CONFIG, ...config }

    if (this.config.autoSync) {
      this.startSync()
    }
  }

  /**
   * 开始同步路由
   */
  startSync(): void {
    if (!this.router) {
      console.warn('Router not provided, cannot sync tabs')
      return
    }

    // Vue Router
    if (typeof this.router.afterEach === 'function') {
      this.syncVueRouter()
    }
    // React Router 或其他
    else {
      console.warn('Unsupported router type')
    }
  }

  /**
   * 停止同步路由
   */
  stopSync(): void {
    if (this.unwatch) {
      this.unwatch()
      this.unwatch = null
    }
  }

  /**
   * 同步 Vue Router
   */
  private syncVueRouter(): void {
    // 处理当前路由
    if (this.router.currentRoute) {
      const currentRoute = this.router.currentRoute.value || this.router.currentRoute
      this.handleRouteChange(currentRoute)
    }

    // 监听路由变化
    this.unwatch = this.router.afterEach((to: any) => {
      this.handleRouteChange(to)
    })
  }

  /**
   * 处理路由变化
   */
  private handleRouteChange(route: any): void {
    // 检查是否应该创建标签
    if (!this.config.shouldCreateTab(route)) {
      return
    }

    // 构建标签配置
    const tabConfig: TabConfig = {
      title: this.config.getTabTitle(route),
      path: route.path,
      icon: this.config.getTabIcon(route),
      pinned: this.config.shouldPinTab(route),
      meta: {
        ...route.meta,
        params: route.params,
        query: route.query,
      },
    }

    // 检查是否已存在
    if (this.manager.hasDuplicateTab(tabConfig.path)) {
      // 如果已存在，激活它
      const tabs = this.manager.getAllTabs()
      const existingTab = tabs.find(t => t.path === tabConfig.path)
      if (existingTab) {
        this.manager.activateTab(existingTab.id)
      }
    }
    else {
      // 添加新标签
      this.manager.addTab(tabConfig)
    }
  }

  /**
   * 手动同步路由
   */
  syncRoute(route: any): void {
    this.handleRouteChange(route)
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stopSync()
  }
}

/**
 * 创建路由集成
 */
export function createRouterIntegration(
  manager: TabManager,
  router: any,
  config?: RouterConfig
): RouterIntegration {
  return new RouterIntegration(manager, router, config)
}





