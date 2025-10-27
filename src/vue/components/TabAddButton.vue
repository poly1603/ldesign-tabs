<template>
  <button
    class="ld-tabs-add-btn"
    :title="title"
    @click="handleClick"
  >
    <svg viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
    </svg>
  </button>
</template>

<script setup lang="ts">
interface Props {
  title?: string
}

interface Emits {
  (e: 'click'): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '新建标签页',
})

const emit = defineEmits<Emits>()

const handleClick = () => {
  emit('click')
}
</script>
