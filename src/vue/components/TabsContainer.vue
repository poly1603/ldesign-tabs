<template>
  <div :class="[
    'ld-tabs-container',
    `ld-tabs-style-${styleType}`,
    `ld-tabs-width-${widthMode}`,
    `ld-tabs-size-${size}`
  ]">
    <!-- 左侧滚动按钮 -->
    <button v-if="showScrollButtons && canScrollLeft" class="ld-tabs-scroll-btn" @click="scrollLeft">
      <svg viewBox="0 0 16 16" fill="currentColor">
        <path
          d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
      </svg>
    </button>

    <!-- 标签页列表包装器 -->
    <div ref="wrapperRef" class="ld-tabs-wrapper">
      <div ref="listRef" class="ld-tabs-list" @wheel="handleWheel">
        <TabItem v-for="(tab, index) in tabs" :key="tab.id" :tab="tab" :index="index"
          :is-active="activeTabId === tab.id" :is-dragging="dragState.dragIndex === index" :enable-drag="enableDrag"
          :show-icon="showIcon" :allow-close-active="false" @click="handleTabClick" @close="handleTabClose"
          @contextmenu="handleContextMenu" @dragstart="handleDragStart" @dragend="handleDragEnd"
          @dragover="handleDragOver" @dragenter="handleDragEnter" @drop="handleDrop">
          <template v-if="$slots.icon" #icon="{ tab }">
            <slot name="icon" :tab="tab" />
          </template>
          <template v-if="$slots.title" #title="{ tab }">
            <slot name="title" :tab="tab" />
          </template>
          <template v-if="$slots.closeIcon" #close-icon>
            <slot name="close-icon" />
          </template>
        </TabItem>
      </div>
    </div>

    <!-- 右侧滚动按钮 -->
    <button v-if="showScrollButtons && canScrollRight" class="ld-tabs-scroll-btn" @click="scrollRight">
      <svg viewBox="0 0 16 16" fill="currentColor">
        <path
          d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
      </svg>
    </button>

    <!-- 右键菜单 -->
    <TabContextMenu v-model:visible="contextMenu.visible" :x="contextMenu.x" :y="contextMenu.y" :tab="contextMenu.tab"
      :tab-index="contextMenu.tabIndex" :total-tabs="tabs.length" :custom-items="customMenuItems" @pin="handlePin"
      @unpin="handleUnpin" @close-others="handleCloseOthers" @close-right="handleCloseRight"
      @close-left="handleCloseLeft" @close-all="handleCloseAll" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick, provide } from 'vue'
import type { Tab, TabStyleType, TabWidthMode, TabSize } from '../../types'
import TabItem from './TabItem.vue'
import TabContextMenu from './TabContextMenu.vue'

interface CustomMenuItem {
  label: string
  disabled?: boolean
  handler: (tab: Tab) => void
}

interface Props {
  tabs?: Tab[]
  activeTabId?: string | null
  enableDrag?: boolean
  showIcon?: boolean
  showScrollButtons?: boolean
  customMenuItems?: CustomMenuItem[]
  /** 样式类型 */
  styleType?: TabStyleType
  /** 宽度适应模式 */
  widthMode?: TabWidthMode
  /** 尺寸大小 */
  size?: TabSize
}

interface Emits {
  (e: 'tab-click', tab: Tab): void
  (e: 'tab-close', tab: Tab): void
  (e: 'tab-pin', tab: Tab): void
  (e: 'tab-unpin', tab: Tab): void
  (e: 'tab-reorder', fromIndex: number, toIndex: number): void
  (e: 'close-others', tab: Tab): void
  (e: 'close-right', tab: Tab): void
  (e: 'close-left', tab: Tab): void
  (e: 'close-all'): void
}

const props = withDefaults(defineProps<Props>(), {
  tabs: () => [],
  activeTabId: null,
  enableDrag: true,
  showIcon: true,
  showScrollButtons: true,
  customMenuItems: () => [],
  styleType: 'chrome',
  widthMode: 'scroll',
  size: 'md',
})

const emit = defineEmits<Emits>()

// 提供样式类型给子组件
provide('tabStyleType', computed(() => props.styleType))
provide('tabSize', computed(() => props.size))

const wrapperRef = ref<HTMLElement>()
const listRef = ref<HTMLElement>()
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

const dragState = ref({
  dragIndex: -1,
  dropIndex: -1,
})

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  tab: null as Tab | null,
  tabIndex: 0,
})

// 标签点击
const handleTabClick = (tab: Tab) => {
  emit('tab-click', tab)
}

// 标签关闭
const handleTabClose = (tab: Tab) => {
  emit('tab-close', tab)
}

// 右键菜单
const handleContextMenu = (event: MouseEvent, tab: Tab) => {
  const index = props.tabs.findIndex(t => t.id === tab.id)
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    tab,
    tabIndex: index,
  }
}

// 固定标签
const handlePin = (tab: Tab) => {
  emit('tab-pin', tab)
}

// 取消固定
const handleUnpin = (tab: Tab) => {
  emit('tab-unpin', tab)
}

// 关闭其他标签
const handleCloseOthers = (tab: Tab) => {
  emit('close-others', tab)
}

// 关闭右侧标签
const handleCloseRight = (tab: Tab) => {
  emit('close-right', tab)
}

// 关闭左侧标签
const handleCloseLeft = (tab: Tab) => {
  emit('close-left', tab)
}

// 关闭所有标签
const handleCloseAll = () => {
  emit('close-all')
}

// 拖拽开始
const handleDragStart = (event: DragEvent, index: number) => {
  dragState.value.dragIndex = index
}

// 拖拽结束
const handleDragEnd = (event: DragEvent) => {
  if (dragState.value.dragIndex !== -1 && dragState.value.dropIndex !== -1) {
    emit('tab-reorder', dragState.value.dragIndex, dragState.value.dropIndex)
  }
  dragState.value = { dragIndex: -1, dropIndex: -1 }
}

// 拖拽经过
const handleDragOver = (event: DragEvent, index: number) => {
  event.preventDefault()
  dragState.value.dropIndex = index
}

// 拖拽进入
const handleDragEnter = (event: DragEvent, index: number) => {
  event.preventDefault()
  dragState.value.dropIndex = index
}

// 放置
const handleDrop = (event: DragEvent, index: number) => {
  event.preventDefault()
  dragState.value.dropIndex = index
}

// 鼠标滚轮横向滚动
const handleWheel = (event: WheelEvent) => {
  if (listRef.value && Math.abs(event.deltaY) > 0) {
    event.preventDefault()
    listRef.value.scrollLeft += event.deltaY
    updateScrollState()
  }
}

// 向左滚动
const scrollLeft = () => {
  if (listRef.value) {
    listRef.value.scrollBy({
      left: -200,
      behavior: 'smooth',
    })
    setTimeout(updateScrollState, 300)
  }
}

// 向右滚动
const scrollRight = () => {
  if (listRef.value) {
    listRef.value.scrollBy({
      left: 200,
      behavior: 'smooth',
    })
    setTimeout(updateScrollState, 300)
  }
}

// 更新滚动状态
const updateScrollState = () => {
  if (!listRef.value) return

  const { scrollLeft, scrollWidth, clientWidth } = listRef.value
  canScrollLeft.value = scrollLeft > 0
  canScrollRight.value = scrollLeft + clientWidth < scrollWidth - 1
}

// 滚动到激活的标签
const scrollToActiveTab = async () => {
  await nextTick()

  if (!listRef.value || !props.activeTabId) return

  const activeTabElement = listRef.value.querySelector('.ld-tab-item.active') as HTMLElement
  if (!activeTabElement) return

  const containerRect = listRef.value.getBoundingClientRect()
  const tabRect = activeTabElement.getBoundingClientRect()

  if (tabRect.left < containerRect.left) {
    listRef.value.scrollBy({
      left: tabRect.left - containerRect.left - 20,
      behavior: 'smooth',
    })
  }
  else if (tabRect.right > containerRect.right) {
    listRef.value.scrollBy({
      left: tabRect.right - containerRect.right + 20,
      behavior: 'smooth',
    })
  }

  setTimeout(updateScrollState, 300)
}

// 监听激活标签变化
watch(() => props.activeTabId, () => {
  scrollToActiveTab()
})

// 监听标签列表变化
watch(() => props.tabs.length, () => {
  nextTick(() => {
    updateScrollState()
  })
})

// Shrink 模式 - 计算标签宽度
const calculateShrinkWidths = () => {
  if (props.widthMode !== 'shrink' || !wrapperRef.value || !listRef.value) return

  const wrapper = wrapperRef.value
  const list = listRef.value
  const tabElements = list.querySelectorAll('.ld-tab-item')

  if (tabElements.length === 0) return

  // 获取容器可用宽度（减去滚动按钮的宽度）
  const scrollBtnWidth = props.showScrollButtons ? 72 : 0 // 两个按钮各36px
  const availableWidth = wrapper.clientWidth - scrollBtnWidth

  // 计算每个标签的理想宽度
  const tabCount = tabElements.length
  const idealWidth = availableWidth / tabCount

  // 获取最小和最大宽度限制
  const minWidth = 60 // --ld-tabs-min-width-shrink
  const maxWidth = 200 // --ld-tabs-max-width

  // 计算实际宽度
  let actualWidth = Math.max(minWidth, Math.min(idealWidth, maxWidth))

  // 应用宽度到每个标签
  tabElements.forEach((tab) => {
    ; (tab as HTMLElement).style.width = `${actualWidth}px`
  })

  // 如果即使使用最小宽度还是超出，启用滚动
  const totalWidth = tabCount * actualWidth
  if (totalWidth > availableWidth) {
    list.style.overflowX = 'auto'
    updateScrollState()
  } else {
    list.style.overflowX = 'hidden'
    canScrollLeft.value = false
    canScrollRight.value = false
  }
}

// ResizeObserver 监听容器大小变化
let resizeObserver: ResizeObserver | null = null

// 监听窗口大小变化
const handleResize = () => {
  updateScrollState()
  if (props.widthMode === 'shrink') {
    calculateShrinkWidths()
  }
}

onMounted(() => {
  updateScrollState()
  window.addEventListener('resize', handleResize)
  if (listRef.value) {
    listRef.value.addEventListener('scroll', updateScrollState)
  }

  // 设置 ResizeObserver 监听容器宽度变化
  if (wrapperRef.value) {
    resizeObserver = new ResizeObserver(() => {
      if (props.widthMode === 'shrink') {
        calculateShrinkWidths()
      } else {
        updateScrollState()
      }
    })
    resizeObserver.observe(wrapperRef.value)
  }

  // 初始化 shrink 模式
  if (props.widthMode === 'shrink') {
    nextTick(() => {
      calculateShrinkWidths()
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (listRef.value) {
    listRef.value.removeEventListener('scroll', updateScrollState)
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

// 监听标签列表和宽度模式变化
watch(() => [props.tabs.length, props.widthMode], () => {
  nextTick(() => {
    if (props.widthMode === 'shrink') {
      calculateShrinkWidths()
    } else {
      updateScrollState()
    }
  })
})
</script>
