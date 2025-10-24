/**
 * 拖拽处理器
 */

import type { DragConfig } from '../types'
import type { TabManager } from './manager'

/**
 * 默认拖拽配置
 */
const DEFAULT_DRAG_CONFIG: Required<DragConfig> = {
  enabled: true,
  delay: 0,
  distance: 5,
}

/**
 * 拖拽状态
 */
interface DragState {
  dragging: boolean
  dragIndex: number
  dropIndex: number
  startX: number
  startY: number
}

/**
 * 拖拽处理器类
 */
export class DragHandler {
  private config: Required<DragConfig>
  private manager: TabManager
  private state: DragState
  private dragTimer: ReturnType<typeof setTimeout> | null = null

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
   * 是否启用
   */
  get enabled(): boolean {
    return this.config.enabled
  }

  /**
   * 设置是否启用
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
  }

  /**
   * 处理拖拽开始
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
   * 处理拖拽结束
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
   * 处理拖拽经过
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
   * 处理拖拽进入
   */
  handleDragEnter(event: DragEvent, index: number): void {
    if (!this.config.enabled || !this.state.dragging) {
      return
    }

    event.preventDefault()
    this.state.dropIndex = index
  }

  /**
   * 处理拖拽离开
   */
  handleDragLeave(event: DragEvent): void {
    if (!this.config.enabled || !this.state.dragging) {
      return
    }

    event.preventDefault()
  }

  /**
   * 处理放置
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
   */
  getDragState(): Readonly<DragState> {
    return { ...this.state }
  }

  /**
   * 重置状态
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
   * 销毁
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
 */
export function createDragHandler(manager: TabManager, config?: DragConfig): DragHandler {
  return new DragHandler(manager, config)
}







