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
        <span>📌 固定标签</span>
      </div>
      <div
        v-if="tab?.pinned"
        class="ld-tabs-context-menu-item"
        @click="handleUnpin"
      >
        <span>📍 取消固定</span>
      </div>

      <div class="ld-tabs-context-menu-divider" />

      <div
        class="ld-tabs-context-menu-item"
        :class="{ disabled: !canCloseOthers }"
        @click="handleCloseOthers"
      >
        <span>关闭其他标签</span>
      </div>
      <div
        class="ld-tabs-context-menu-item"
        :class="{ disabled: !canCloseRight }"
        @click="handleCloseRight"
      >
        <span>关闭右侧标签</span>
      </div>
      <div
        class="ld-tabs-context-menu-item"
        :class="{ disabled: !canCloseLeft }"
        @click="handleCloseLeft"
      >
        <span>关闭左侧标签</span>
      </div>
      <div
        class="ld-tabs-context-menu-item"
        :class="{ disabled: !canCloseAll }"
        @click="handleCloseAll"
      >
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





