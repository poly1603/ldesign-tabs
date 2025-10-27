<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="menuRef"
      class="ld-tabs-context-menu ld-tabs-scale-in"
      :style="menuStyle"
      @click.stop
      @contextmenu.prevent
    >
      <div
        v-if="!tab?.pinned"
        class="ld-tabs-context-menu-item"
        @click="handlePin"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" class="ld-tabs-menu-icon">
          <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707-.195-.195.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a5.922 5.922 0 0 1 1.013.16l3.134-3.133a2.772 2.772 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146z"/>
        </svg>
        <span>固定标签</span>
      </div>
      <div
        v-if="tab?.pinned"
        class="ld-tabs-context-menu-item"
        @click="handleUnpin"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" class="ld-tabs-menu-icon">
          <path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A5.921 5.921 0 0 1 5 6.708V2.277a2.77 2.77 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354z"/>
        </svg>
        <span>取消固定</span>
      </div>

      <div class="ld-tabs-context-menu-divider" />

      <div
        class="ld-tabs-context-menu-item"
        :class="{ disabled: !canCloseOthers }"
        @click="handleCloseOthers"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" class="ld-tabs-menu-icon">
          <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
        </svg>
        <span>关闭其他标签</span>
      </div>
      <div
        class="ld-tabs-context-menu-item"
        :class="{ disabled: !canCloseRight }"
        @click="handleCloseRight"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" class="ld-tabs-menu-icon">
          <path d="M4.854 4.146a.5.5 0 0 1 0 .708L1.707 8l3.147 3.146a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0zm6.792 0a.5.5 0 0 0 0 .708L14.793 8l-3.147 3.146a.5.5 0 0 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 0 0-.708 0z"/>
          <path d="M8.354 4.146a.5.5 0 0 1 0 .708L5.207 8l3.147 3.146a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0z"/>
        </svg>
        <span>关闭右侧标签</span>
      </div>
      <div
        class="ld-tabs-context-menu-item"
        :class="{ disabled: !canCloseLeft }"
        @click="handleCloseLeft"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" class="ld-tabs-menu-icon">
          <path d="M11.146 4.146a.5.5 0 0 1 .708 0l3.5 3.5a.5.5 0 0 1 0 .708l-3.5 3.5a.5.5 0 0 1-.708-.708L14.293 8l-3.147-3.146a.5.5 0 0 1 0-.708zm-6.792 0a.5.5 0 0 0-.708 0l-3.5 3.5a.5.5 0 0 0 0 .708l3.5 3.5a.5.5 0 0 0 .708-.708L1.207 8l3.147-3.146a.5.5 0 0 0 0-.708z"/>
          <path d="M7.646 4.146a.5.5 0 0 1 .708 0l3.5 3.5a.5.5 0 0 1 0 .708l-3.5 3.5a.5.5 0 0 1-.708-.708L10.793 8 7.646 4.854a.5.5 0 0 1 0-.708z"/>
        </svg>
        <span>关闭左侧标签</span>
      </div>
      <div
        class="ld-tabs-context-menu-item"
        :class="{ disabled: !canCloseAll }"
        @click="handleCloseAll"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" class="ld-tabs-menu-icon">
          <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z"/>
        </svg>
        <span>关闭所有标签</span>
      </div>

      <template v-if="customItems && customItems.length > 0">
        <div class="ld-tabs-context-menu-divider" />
        <div
          v-for="(item, index) in customItems"
          :key="index"
          class="ld-tabs-context-menu-item"
          :class="{ disabled: item.disabled }"
          @click="handleCustomItem(item)"
        >
          <span>{{ item.label }}</span>
        </div>
      </template>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { Tab } from '../../types'

interface CustomMenuItem {
  label: string
  disabled?: boolean
  handler: (tab: Tab) => void
}

interface Props {
  visible?: boolean
  x?: number
  y?: number
  tab?: Tab | null
  tabIndex?: number
  totalTabs?: number
  customItems?: CustomMenuItem[]
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'pin', tab: Tab): void
  (e: 'unpin', tab: Tab): void
  (e: 'close-others', tab: Tab): void
  (e: 'close-right', tab: Tab): void
  (e: 'close-left', tab: Tab): void
  (e: 'close-all'): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  x: 0,
  y: 0,
  tab: null,
  tabIndex: 0,
  totalTabs: 0,
  customItems: () => [],
})

const emit = defineEmits<Emits>()

const menuRef = ref<HTMLElement>()

const menuStyle = computed(() => ({
  left: `${props.x}px`,
  top: `${props.y}px`,
}))

const canCloseOthers = computed(() => {
  return props.totalTabs > 1
})

const canCloseRight = computed(() => {
  return props.tabIndex < props.totalTabs - 1
})

const canCloseLeft = computed(() => {
  return props.tabIndex > 0
})

const canCloseAll = computed(() => {
  return props.totalTabs > 0
})

const handlePin = () => {
  if (props.tab) {
    emit('pin', props.tab)
    close()
  }
}

const handleUnpin = () => {
  if (props.tab) {
    emit('unpin', props.tab)
    close()
  }
}

const handleCloseOthers = () => {
  if (props.tab && canCloseOthers.value) {
    emit('close-others', props.tab)
    close()
  }
}

const handleCloseRight = () => {
  if (props.tab && canCloseRight.value) {
    emit('close-right', props.tab)
    close()
  }
}

const handleCloseLeft = () => {
  if (props.tab && canCloseLeft.value) {
    emit('close-left', props.tab)
    close()
  }
}

const handleCloseAll = () => {
  if (canCloseAll.value) {
    emit('close-all')
    close()
  }
}

const handleCustomItem = (item: CustomMenuItem) => {
  if (!item.disabled && props.tab) {
    item.handler(props.tab)
    close()
  }
}

const close = () => {
  emit('update:visible', false)
}

const handleClickOutside = (event: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    close()
  }
}

watch(() => props.visible, async (visible) => {
  if (visible) {
    await nextTick()
    // 调整菜单位置，确保不超出视口
    if (menuRef.value) {
      const rect = menuRef.value.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let adjustedX = props.x
      let adjustedY = props.y

      if (rect.right > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10
      }

      if (rect.bottom > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10
      }

      if (adjustedX !== props.x || adjustedY !== props.y) {
        menuRef.value.style.left = `${adjustedX}px`
        menuRef.value.style.top = `${adjustedY}px`
      }
    }

    document.addEventListener('click', handleClickOutside)
  }
  else {
    document.removeEventListener('click', handleClickOutside)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>











