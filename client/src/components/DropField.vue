<template>
  <div @drop.prevent="onDrop">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { reportError } from '@/stores/errorstore'
const emit = defineEmits(['files-dropped'])

function onDrop(e: DragEvent) {
  if (e.dataTransfer === null) { reportError("e.dataTransfer is null"); return }
  const fileList = []
  for (let i = 0; i < e.dataTransfer.files.length; i++) {
    fileList.push(e.dataTransfer.files.item(i))
  }
  emit('files-dropped', fileList)
}

function preventDefaults(e: Event) {
  e.preventDefault()
}

const events = ['dragenter', 'dragover', 'dragleave', 'drop']

onMounted(() => {
  events.forEach((eventName) => {
    document.body.addEventListener(eventName, preventDefaults)
  })
})

onUnmounted(() => {
  events.forEach((eventName) => {
    document.body.removeEventListener(eventName, preventDefaults)
  })
})
</script>
