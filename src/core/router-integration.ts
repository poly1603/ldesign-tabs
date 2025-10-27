/**
 * 路由集成
 * 
 * 提供标签页系统与路由系统的无缝集成，实现自动化的标签管理。
 * 当路由变化时，自动创建、激活或复用对应的标签页。
 * 
 * 主要特性：
 * - 自动同步路由变化到标签页
 * - 可自定义标签标题和图标提取逻辑
 * - 支持路由元信息（meta）配置
 * - 灵活的标签创建规则（可排除特定页面）
 * - 支持固定标签（如首页）
 * - 兼容 Vue Router（其他路由库需要适配）
 * 
 * @example
 * ```typescript
 * const integration = new RouterIntegration(manager, router, {
 *   autoSync: true,
 *   getTabTitle: (route) => route.meta?.title || route.name,
 *   shouldCreateTab: (route) => route.meta?.layout !== 'blank'
 * })
 * ```
 */

import type { RouterConfig, TabConfig } from '../types'
import { extractTitleFromPath } from '../utils'
import type { TabManager } from './manager'

/**
 * 默认路由配置
 * 
 * 提供合理的默认行为，适用于大多数 Vue Router 应用。
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
 * 路由集成处理器类
 * 
 * 管理路由与标签页之间的同步逻辑。
 * 监听路由变化并自动维护标签页状态。
 */
export class RouterIntegration {
  /** 路由配置 */
  private config: Required<RouterConfig>

  /** 标签管理器实例 */
  private manager: TabManager

  /** 路由实例（Vue Router 或其他） */
  private router: any

  /** 取消路由监听的函数 */
  private unwatch: (() => void) | null = null

  /**
   * 构造函数
   * 
   * @param manager - 标签管理器实例
   * @param router - 路由实例（通常是 Vue Router）
   * @param config - 路由集成配置
   * 
   * @example
   * ```typescript
   * const integration = new RouterIntegration(manager, router, {
   *   autoSync: true,
   *   getTabTitle: (route) => route.meta.title,
   *   shouldCreateTab: (route) => route.meta.showTab !== false
   * })
   * ```
   */
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











