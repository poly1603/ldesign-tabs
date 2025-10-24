<template>
  <div v-if="showButtons" class="ld-tabs-scroll-buttons">
    <!-- 向左滚动 -->
    <button
      class="ld-tabs-scroll-btn"
      :disabled="!canScrollLeft"
      @click="scrollLeft"
    >
      <slot name="left-icon">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
        </svg>
      </slot>
    </button>

    <!-- 向右滚动 -->
    <button
      class="ld-tabs-scroll-btn"
      :disabled="!canScrollRight"
      @click="scrollRight"
    >
      <slot name="right-icon">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
        </svg>
      </slot>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  scrollAmount?: number
  showButtons?: boolean
}

interface Emits {
  (e: 'scroll-left'): void
  (e: 'scroll-right'): void
}

const props = withDefaults(defineProps<Props>(), {
  scrollAmount: 200,
  showButtons: true,
})

const emit = defineEmits<Emits>()

const canScrollLeft = ref(false)
const canScrollRight = ref(false)

const scrollLeft = () => {
  emit('scroll-left')
}

const scrollRight = () => {
  emit('scroll-right')
}

// 暴露方法给父组件
defineExpose({
  updateScrollState(left: boolean, right: boolean) {
    canScrollLeft.value = left
    canScrollRight.value = right
  }
})
</script>







