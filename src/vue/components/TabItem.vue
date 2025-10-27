<template>
  <div :class="[
    'ld-tab-item',
    {
      'active': isActive,
      'pinned': tab.pinned,
      'dragging': isDragging,
      'loading': tab.status === 'loading',
      'error': tab.status === 'error',
      'not-closable': !tab.closable || (isActive && !allowCloseActive)
    }
  ]" :draggable="enableDrag" :title="`${tab.title}\n${tab.path}`" @click="handleClick"
    @contextmenu="handleContextMenu" @dragstart="handleDragStart" @dragend="handleDragEnd" @dragover="handleDragOver"
    @dragenter="handleDragEnter" @dragleave="handleDragLeave" @drop="handleDrop">
    <!-- 分隔线 -->
    <div class="ld-tab-separator"></div>
    
    <!-- 图标 -->
    <span v-if="tab.icon && showIcon" class="ld-tab-icon">
      <slot name="icon" :tab="tab">
        {{ tab.icon }}
      </slot>
    </span>

    <!-- 标题 -->
    <span class="ld-tab-title">
      <slot name="title" :tab="tab">
        {{ tab.title }}
      </slot>
    </span>

    <!-- 关闭按钮 -->
    <button v-if="tab.closable && (!isActive || allowCloseActive)" class="ld-tab-close" @click.stop="handleClose">
      <slot name="close-icon">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path
            d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
        </svg>
      </slot>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import type { Tab, TabStyleType, TabSize } from '../../types'

interface Props {
  tab: Tab
  index: number
  isActive?: boolean
  isDragging?: boolean
  enableDrag?: boolean
  showIcon?: boolean
  allowCloseActive?: boolean
}

interface Emits {
  (e: 'click', tab: Tab): void
  (e: 'close', tab: Tab): void
  (e: 'contextmenu', event: MouseEvent, tab: Tab): void
  (e: 'dragstart', event: DragEvent, index: number): void
  (e: 'dragend', event: DragEvent): void
  (e: 'dragover', event: DragEvent, index: number): void
  (e: 'dragenter', event: DragEvent, index: number): void
  (e: 'dragleave', event: DragEvent): void
  (e: 'drop', event: DragEvent, index: number): void
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  isDragging: false,
  enableDrag: true,
  showIcon: true,
  allowCloseActive: false,
})

const emit = defineEmits<Emits>()

// 从父组件注入样式类型
const styleType = inject<TabStyleType>('tabStyleType', 'chrome')
const size = inject<TabSize>('tabSize', 'md')

const handleClick = () => {
  emit('click', props.tab)
}

const handleClose = () => {
  emit('close', props.tab)
}

const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  emit('contextmenu', event, props.tab)
}

const handleDragStart = (event: DragEvent) => {
  if (props.enableDrag) {
    emit('dragstart', event, props.index)
  }
}

const handleDragEnd = (event: DragEvent) => {
  emit('dragend', event)
}

const handleDragOver = (event: DragEvent) => {
  if (props.enableDrag) {
    emit('dragover', event, props.index)
  }
}

const handleDragEnter = (event: DragEvent) => {
  if (props.enableDrag) {
    emit('dragenter', event, props.index)
  }
}

const handleDragLeave = (event: DragEvent) => {
  emit('dragleave', event)
}

const handleDrop = (event: DragEvent) => {
  if (props.enableDrag) {
    emit('drop', event, props.index)
  }
}
</script>
