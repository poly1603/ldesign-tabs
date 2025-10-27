/**
 * 拖拽处理器
 * 
 * 负责处理标签页的拖拽排序功能，提供流畅的拖拽体验。
 * 支持拖拽延迟、距离阈值、拖拽预览等高级特性。
 * 
 * 主要功能：
 * - HTML5 原生拖拽 API 的封装
 * - 拖拽状态管理
 * - 拖拽验证（固定标签区域隔离）
 * - 拖拽视觉反馈
 * 
 * @example
 * ```typescript
 * const dragHandler = new DragHandler(manager, {
 *   enabled: true,
 *   delay: 100,    // 100ms 延迟启动拖拽
 *   distance: 5    // 移动5px后才认为是拖拽
 * })
 * ```
 */

import type { DragConfig } from '../types'
import type { TabManager } from './manager'

/**
 * 默认拖拽配置
 * 提供合理的默认值以适应大多数使用场景
 */
const DEFAULT_DRAG_CONFIG: Required<DragConfig> = {
  enabled: true,    // 默认启用拖拽
  delay: 0,         // 无延迟（0ms）
  distance: 5,      // 移动5像素后才认为是拖拽操作
}

/**
 * 拖拽状态接口
 * 
 * 记录拖拽过程中的所有状态信息
 */
interface DragState {
  /** 是否正在拖拽 */
  dragging: boolean
  /** 拖拽源索引（被拖拽的标签位置） */
  dragIndex: number
  /** 拖拽目标索引（要放置到的位置） */
  dropIndex: number
  /** 拖拽开始时的X坐标 */
  startX: number
  /** 拖拽开始时的Y坐标 */
  startY: number
}

/**
 * 拖拽处理器类
 * 
 * 管理标签页的拖拽交互逻辑，与 TabManager 配合工作。
 * 处理所有拖拽相关的 DOM 事件，并在适当的时机调用管理器的方法。
 */
export class DragHandler {
  private config: Required<DragConfig>
  private manager: TabManager
  private state: DragState
  private dragTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * 构造函数
   * 
   * @param manager - 标签管理器实例
   * @param config - 拖拽配置选项
   * 
   * @example
   * ```typescript
   * const dragHandler = new DragHandler(manager, {
   *   enabled: true,
   *   delay: 100,
   *   distance: 5
   * })
   * ```
   */
  constructor(manager: TabManager, config: DragConfig = {}) {
    this.manager = manager
    this.config = { ...DEFAULT_DRAG_CONFIG, ...config }
    this.state = {
      dragging: false,
      dragIndex: -1,
      dropIndex: -1,
      startX: 0,
      startY: 0,
    }
  }

  /**
   * 是否启用拖拽
   * 
   * @returns 启用状态
   */
  get enabled(): boolean {
    return this.config.enabled
  }

  /**
   * 设置是否启用拖拽
   * 
   * 可以动态开关拖拽功能，比如在移动设备上禁用拖拽。
   * 
   * @param enabled - true 启用，false 禁用
   * 
   * @example
   * ```typescript
   * // 在移动设备上禁用拖拽
   * if (isMobile) {
   *   dragHandler.setEnabled(false)
   * }
   * ```
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
  }

  /**
   * 处理拖拽开始事件
   * 
   * 当用户开始拖拽标签时调用。此方法会：
   * 1. 检查拖拽是否启用
   * 2. 记录拖拽的起始位置和索引
   * 3. 设置拖拽数据传输对象
   * 4. 创建拖拽预览图像
   * 5. 启动延迟计时器（如果配置了延迟）
   * 
   * @param event - 拖拽开始事件对象
   * @param index - 被拖拽标签的索引位置
   * 
   * @example
   * ```typescript
   * <div
   *   draggable="true"
   *   @dragstart="(e) => dragHandler.handleDragStart(e, index)"
   * >
   * ```
   */
  handleDragStart(event: DragEvent, index: number): void {
    if (!this.config.enabled) {
      event.preventDefault()
      return
    }

    this.state.dragIndex = index
    this.state.startX = event.clientX
    this.state.startY = event.clientY

    // 设置拖拽数据
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', String(index))

      // 设置拖拽图像（如果需要）
      const target = event.target as HTMLElement
      if (target) {
        const clone = target.cloneNode(true) as HTMLElement
        clone.style.opacity = '0.5'
        clone.style.position = 'absolute'
        clone.style.top = '-9999px'
        document.body.appendChild(clone)
        event.dataTransfer.setDragImage(clone, 0, 0)

        // 延迟移除克隆节点
        setTimeout(() => {
          document.body.removeChild(clone)
        }, 0)
      }
    }

    // 处理延迟
    if (this.config.delay > 0) {
      this.dragTimer = setTimeout(() => {
        this.state.dragging = true
      }, this.config.delay)
    }
    else {
      this.state.dragging = true
    }
  }

  /**
   * 处理拖拽结束事件
   * 
   * 当用户完成拖拽操作（松开鼠标）时调用。此方法会：
   * 1. 清除延迟计时器
   * 2. 如果有有效的放置位置，执行标签重新排序
   * 3. 重置拖拽状态
   * 
   * @param event - 拖拽结束事件对象
   * 
   * @example
   * ```typescript
   * <div
   *   draggable="true"
   *   @dragend="dragHandler.handleDragEnd"
   * >
   * ```
   */
  handleDragEnd(event: DragEvent): void {
    if (!this.config.enabled) {
      return
    }

    // 清除定时器
    if (this.dragTimer) {
      clearTimeout(this.dragTimer)
      this.dragTimer = null
    }

    // 如果发生了拖拽且有有效的drop位置
    if (this.state.dragging && this.state.dropIndex !== -1 && this.state.dragIndex !== -1) {
      // 执行重新排序
      this.manager.reorderTabs(this.state.dragIndex, this.state.dropIndex)
    }

    // 重置状态
    this.resetState()
  }

  /**
   * 处理拖拽经过事件
   * 
   * 当拖拽的标签经过其他标签时调用。此方法会：
   * 1. 阻止默认行为（允许放置）
   * 2. 设置拖拽效果为 "move"
   * 3. 检查移动距离是否达到阈值
   * 4. 更新放置目标索引
   * 
   * 这是拖拽过程中持续触发的事件，需要注意性能。
   * 
   * @param event - 拖拽经过事件对象
   * @param index - 经过的标签索引
   */
  handleDragOver(event: DragEvent, index: number): void {
    if (!this.config.enabled || !this.state.dragging) {
      return
    }

    event.preventDefault()

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }

    // 检查距离阈值
    const distance = Math.sqrt(
      (event.clientX - this.state.startX) ** 2 +
      (event.clientY - this.state.startY) ** 2
    )

    if (distance < this.config.distance) {
      return
    }

    this.state.dropIndex = index
  }

  /**
   * 处理拖拽进入事件
   * 
   * 当拖拽的标签进入另一个标签的区域时调用。
   * 更新放置目标索引，用于确定最终的放置位置。
   * 
   * @param event - 拖拽进入事件对象
   * @param index - 进入的标签索引
   */
  handleDragEnter(event: DragEvent, index: number): void {
    if (!this.config.enabled || !this.state.dragging) {
      return
    }

    event.preventDefault()
    this.state.dropIndex = index
  }

  /**
   * 处理拖拽离开事件
   * 
   * 当拖拽的标签离开另一个标签的区域时调用。
   * 主要用于清除视觉反馈状态。
   * 
   * @param event - 拖拽离开事件对象
   */
  handleDragLeave(event: DragEvent): void {
    if (!this.config.enabled || !this.state.dragging) {
      return
    }

    event.preventDefault()
  }

  /**
   * 处理放置事件
   * 
   * 当用户在目标位置松开鼠标时调用。
   * 这是拖拽操作的最终确认点，记录最终的放置位置。
   * 
   * @param event - 放置事件对象
   * @param index - 放置的目标索引
   */
  handleDrop(event: DragEvent, index: number): void {
    if (!this.config.enabled || !this.state.dragging) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    this.state.dropIndex = index
  }

  /**
   * 获取当前拖拽状态
   * 
   * 返回拖拽状态的只读副本，用于外部查询拖拽信息。
   * 可用于实现自定义的拖拽视觉反馈。
   * 
   * @returns 拖拽状态对象（只读）
   * 
   * @example
   * ```typescript
   * const state = dragHandler.getDragState()
   * if (state.dragging) {
   *   console.log(`正在拖拽索引 ${state.dragIndex} 到 ${state.dropIndex}`)
   * }
   * ```
   */
  getDragState(): Readonly<DragState> {
    return { ...this.state }
  }

  /**
   * 重置拖拽状态
   * 
   * 内部方法：将所有拖拽状态重置为初始值。
   * 在拖拽结束或取消时调用。
   */
  private resetState(): void {
    this.state = {
      dragging: false,
      dragIndex: -1,
      dropIndex: -1,
      startX: 0,
      startY: 0,
    }
  }

  /**
   * 销毁拖拽处理器
   * 
   * 清理所有资源，包括：
   * - 清除延迟计时器
   * - 重置拖拽状态
   * 
   * 在组件卸载时调用以防止内存泄漏。
   * 
   * @example
   * ```typescript
   * onUnmounted(() => {
   *   dragHandler.destroy()
   * })
   * ```
   */
  destroy(): void {
    if (this.dragTimer) {
      clearTimeout(this.dragTimer)
      this.dragTimer = null
    }
    this.resetState()
  }
}

/**
 * 创建拖拽处理器
 * 
 * 工厂函数：创建并返回一个拖拽处理器实例。
 * 这是推荐的创建拖拽处理器的方式。
 * 
 * @param manager - 标签管理器实例
 * @param config - 可选的拖拽配置
 * @returns 拖拽处理器实例
 * 
 * @example
 * ```typescript
 * const dragHandler = createDragHandler(manager, {
 *   enabled: true,
 *   delay: 100,     // 拖拽延迟100ms
 *   distance: 5     // 移动5px后才开始拖拽
 * })
 * ```
 */
export function createDragHandler(manager: TabManager, config?: DragConfig): DragHandler {
  return new DragHandler(manager, config)
}











