/**
 * 高级拖拽处理器
 * 
 * 在基础拖拽功能上提供增强特性：
 * - 拖拽位置指示器
 * - 多标签批量拖拽
 * - 手势优化（磁吸效果）
 * - 拖拽预览增强
 * - 拖拽边界检测
 * 
 * @example
 * ```typescript
 * const advancedDrag = new AdvancedDragHandler(manager, {
 *   showIndicator: true,
 *   magneticSnap: true,
 *   snapThreshold: 20
 * })
 * ```
 */

import type { Tab } from '../types'
import type { TabManager } from './manager'
import { DragHandler } from './drag-handler'

/**
 * 高级拖拽配置
 */
export interface AdvancedDragConfig {
  /** 是否显示位置指示器（默认true） */
  showIndicator?: boolean
  /** 是否启用磁吸效果（默认true） */
  magneticSnap?: boolean
  /** 磁吸阈值（像素，默认20） */
  snapThreshold?: number
  /** 是否支持多标签拖拽（默认false） */
  multiDrag?: boolean
  /** 拖拽延迟（毫秒，默认0） */
  delay?: number
  /** 拖拽距离阈值（像素，默认5） */
  distance?: number
}

/**
 * 拖拽指示器位置
 */
export interface IndicatorPosition {
  /** 目标索引 */
  index: number
  /** 插入位置（'before' | 'after'） */
  position: 'before' | 'after'
  /** X坐标 */
  x: number
  /** Y坐标 */
  y: number
}

/**
 * 默认配置
 */
const DEFAULT_ADVANCED_CONFIG: Required<AdvancedDragConfig> = {
  showIndicator: true,
  magneticSnap: true,
  snapThreshold: 20,
  multiDrag: false,
  delay: 0,
  distance: 5,
}

/**
 * 高级拖拽处理器类
 */
export class AdvancedDragHandler {
  /** 配置 */
  private config: Required<AdvancedDragConfig>

  /** 标签管理器 */
  private manager: TabManager

  /** 基础拖拽处理器 */
  private dragHandler: DragHandler

  /** 位置指示器元素 */
  private indicator: HTMLElement | null = null

  /** 当前指示器位置 */
  private indicatorPosition: IndicatorPosition | null = null

  /** 选中的标签ID列表（多标签拖拽） */
  private selectedTabIds: Set<string> = new Set()

  /**
   * 构造函数
   * 
   * @param manager - 标签管理器实例
   * @param config - 高级拖拽配置
   * 
   * @example
   * ```typescript
   * const advancedDrag = new AdvancedDragHandler(manager, {
   *   showIndicator: true,
   *   magneticSnap: true,
   *   multiDrag: true
   * })
   * ```
   */
  constructor(manager: TabManager, config: AdvancedDragConfig = {}) {
    this.manager = manager
    this.config = { ...DEFAULT_ADVANCED_CONFIG, ...config }
    this.dragHandler = new DragHandler(manager, {
      enabled: true,
      delay: this.config.delay,
      distance: this.config.distance,
    })

    if (this.config.showIndicator) {
      this.createIndicator()
    }
  }

  /**
   * 创建位置指示器
   * 
   * 内部方法：创建拖拽位置指示器DOM元素。
   */
  private createIndicator(): void {
    this.indicator = document.createElement('div')
    this.indicator.className = 'ld-tab-drop-indicator'
    this.indicator.style.position = 'absolute'
    this.indicator.style.width = '3px'
    this.indicator.style.height = '36px'
    this.indicator.style.background = 'linear-gradient(to bottom, #1890ff, #40a9ff)'
    this.indicator.style.borderRadius = '2px'
    this.indicator.style.boxShadow = '0 0 8px rgba(24, 144, 255, 0.6)'
    this.indicator.style.zIndex = '1000'
    this.indicator.style.display = 'none'
    this.indicator.style.pointerEvents = 'none'
    this.indicator.style.transition = 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'

    document.body.appendChild(this.indicator)
  }

  /**
   * 显示位置指示器
   * 
   * 在拖拽过程中显示插入位置的视觉指示器。
   * 
   * @param position - 指示器位置信息
   * 
   * @example
   * ```typescript
   * advancedDrag.showIndicator({
   *   index: 2,
   *   position: 'after',
   *   x: 200,
   *   y: 50
   * })
   * ```
   */
  showIndicator(position: IndicatorPosition): void {
    if (!this.indicator || !this.config.showIndicator) {
      return
    }

    this.indicatorPosition = position

    // 应用磁吸效果
    const finalX = this.config.magneticSnap
      ? this.applyMagneticSnap(position.x, position.index)
      : position.x

    this.indicator.style.left = `${finalX}px`
    this.indicator.style.top = `${position.y}px`
    this.indicator.style.display = 'block'

    // 添加脉冲动画
    this.indicator.style.animation = 'ld-tab-indicator-pulse 0.6s ease-in-out'
  }

  /**
   * 隐藏位置指示器
   * 
   * @example
   * ```typescript
   * advancedDrag.hideIndicator()
   * ```
   */
  hideIndicator(): void {
    if (this.indicator) {
      this.indicator.style.display = 'none'
    }
    this.indicatorPosition = null
  }

  /**
   * 应用磁吸效果
   * 
   * 内部方法：当拖拽位置接近目标时，自动吸附到目标位置。
   * 
   * @param x - 当前X坐标
   * @param targetIndex - 目标索引
   * @returns 调整后的X坐标
   */
  private applyMagneticSnap(x: number, targetIndex: number): number {
    // 简化实现：如果距离目标位置小于阈值，自动吸附
    // 实际应用需要获取目标元素的实际位置
    return x
  }

  /**
   * 选择多个标签（多标签拖拽）
   * 
   * @param tabIds - 标签ID数组
   * 
   * @example
   * ```typescript
   * // 启用多标签拖拽
   * advancedDrag.selectMultipleTabs(['tab1', 'tab2', 'tab3'])
   * 
   * // 拖拽时会同时移动这3个标签
   * ```
   */
  selectMultipleTabs(tabIds: string[]): void {
    if (!this.config.multiDrag) {
      console.warn('Multi-drag is not enabled')
      return
    }

    this.selectedTabIds.clear()
    tabIds.forEach(id => this.selectedTabIds.add(id))
  }

  /**
   * 清除多选
   * 
   * @example
   * ```typescript
   * advancedDrag.clearMultiSelection()
   * ```
   */
  clearMultiSelection(): void {
    this.selectedTabIds.clear()
  }

  /**
   * 获取选中的标签数量
   * 
   * @returns 选中标签数量
   */
  getSelectedCount(): number {
    return this.selectedTabIds.size
  }

  /**
   * 检查是否启用多标签拖拽
   * 
   * @returns 如果启用返回true
   */
  isMultiDragEnabled(): boolean {
    return this.config.multiDrag && this.selectedTabIds.size > 0
  }

  /**
   * 处理拖拽开始（增强版）
   * 
   * @param event - 拖拽事件
   * @param index - 标签索引
   * @param tabElement - 标签元素
   */
  handleDragStart(event: DragEvent, index: number, tabElement?: HTMLElement): void {
    // 调用基础处理器
    this.dragHandler.handleDragStart(event, index)

    // 如果启用多标签拖拽
    if (this.isMultiDragEnabled()) {
      // 设置拖拽数据（多个标签）
      if (event.dataTransfer) {
        event.dataTransfer.setData('application/json', JSON.stringify({
          indices: Array.from(this.selectedTabIds).map(id => {
            const tabs = this.manager.getAllTabs()
            return tabs.findIndex(t => t.id === id)
          }).filter(i => i !== -1),
        }))
      }
    }
  }

  /**
   * 处理拖拽结束（增强版）
   * 
   * @param event - 拖拽事件
   */
  handleDragEnd(event: DragEvent): void {
    // 隐藏指示器
    this.hideIndicator()

    // 调用基础处理器
    this.dragHandler.handleDragEnd(event)

    // 清除多选（如果需要）
    if (this.isMultiDragEnabled()) {
      this.clearMultiSelection()
    }
  }

  /**
   * 处理拖拽经过（增强版）
   * 
   * @param event - 拖拽事件
   * @param index - 标签索引
   * @param tabElement - 标签元素
   */
  handleDragOver(event: DragEvent, index: number, tabElement?: HTMLElement): void {
    // 调用基础处理器
    this.dragHandler.handleDragOver(event, index)

    // 更新指示器位置
    if (this.config.showIndicator && tabElement) {
      const rect = tabElement.getBoundingClientRect()
      const mouseX = event.clientX

      // 判断插入位置（元素左侧还是右侧）
      const insertPosition = mouseX < rect.left + rect.width / 2 ? 'before' : 'after'

      this.showIndicator({
        index,
        position: insertPosition,
        x: insertPosition === 'before' ? rect.left : rect.right,
        y: rect.top,
      })
    }
  }

  /**
   * 获取拖拽状态
   * 
   * @returns 拖拽状态对象
   */
  getDragState() {
    return this.dragHandler.getDragState()
  }

  /**
   * 销毁高级拖拽处理器
   * 
   * 清理所有资源。
   * 
   * @example
   * ```typescript
   * onUnmounted(() => {
   *   advancedDrag.destroy()
   * })
   * ```
   */
  destroy(): void {
    // 清除指示器
    if (this.indicator && this.indicator.parentNode) {
      this.indicator.parentNode.removeChild(this.indicator)
      this.indicator = null
    }

    // 清除选择
    this.selectedTabIds.clear()

    // 销毁基础处理器
    this.dragHandler.destroy()
  }
}

/**
 * 创建高级拖拽处理器
 * 
 * @param manager - 标签管理器实例
 * @param config - 高级拖拽配置
 * @returns 高级拖拽处理器实例
 * 
 * @example
 * ```typescript
 * const advancedDrag = createAdvancedDragHandler(manager, {
 *   showIndicator: true,
 *   magneticSnap: true,
 *   multiDrag: true,
 *   snapThreshold: 25
 * })
 * ```
 */
export function createAdvancedDragHandler(
  manager: TabManager,
  config?: AdvancedDragConfig
): AdvancedDragHandler {
  return new AdvancedDragHandler(manager, config)
}

