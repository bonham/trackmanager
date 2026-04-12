<script setup lang="ts">
import { ref, computed } from 'vue'
import { BModal, BButton } from 'bootstrap-vue-next'
import { useErrorStore } from '@/stores/errorstore'
import type { ErrorEntry } from '@/stores/errorstore'

const errorStore = useErrorStore()

const overlayVisible = ref(false)
const confirmDismissVisible = ref(false)
const copiedId = ref<number | null>(null)
const copiedAll = ref(false)

const displayCount = computed(() =>
  errorStore.errorCount > 99 ? '99+' : String(errorStore.errorCount)
)

function formatEntry(e: ErrorEntry): string {
  return `[${e.timestamp.toISOString()}] ${e.message}` +
    (e.detail ? `\n${e.detail}` : '')
}

async function copyOne(e: ErrorEntry) {
  await navigator.clipboard.writeText(formatEntry(e))
  copiedId.value = e.id
  setTimeout(() => { copiedId.value = null }, 1500)
}

async function copyAll() {
  await navigator.clipboard.writeText(
    errorStore.errors.map(formatEntry).join('\n\n---\n\n')
  )
  copiedAll.value = true
  setTimeout(() => { copiedAll.value = false }, 1500)
}

function confirmedDismissAll() {
  errorStore.dismissAll()
  confirmDismissVisible.value = false
  overlayVisible.value = false
}
</script>

<template>
  <button v-if="errorStore.hasErrors" v-show="!overlayVisible" class="error-fab btn btn-danger shadow-lg"
    :aria-label="`${errorStore.errorCount} errors — click to view`" @click="overlayVisible = true">
    <i-bi-exclamation-triangle-fill />
    <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark">
      {{ displayCount }}
    </span>
  </button>

  <BModal v-model="overlayVisible" title="Error Log" size="lg" scrollable>
    <div v-for="entry in errorStore.errors" :key="entry.id"
      class="d-flex align-items-start gap-2 mb-2 p-2 border rounded">
      <div class="flex-grow-1 font-monospace small text-break">
        <div>{{ entry.message }}</div>
        <div v-if="entry.detail" class="text-muted small mt-1" style="max-height: 3em; overflow: hidden">
          {{ entry.detail }}
        </div>
        <div class="text-muted" style="font-size: 0.7em">
          {{ entry.timestamp.toLocaleTimeString() }}
        </div>
      </div>
      <button class="btn btn-sm btn-outline-secondary flex-shrink-0"
        :title="copiedId === entry.id ? 'Copied!' : 'Copy message'" @click="copyOne(entry)">
        <i-bi-check2 v-if="copiedId === entry.id" />
        <i-bi-clipboard v-else />
      </button>
      <button class="btn-close flex-shrink-0 mt-1" aria-label="Dismiss" @click="errorStore.dismissError(entry.id)" />
    </div>
    <template #footer>
      <BButton variant="outline-secondary" class="me-auto" @click="copyAll">
        <i-bi-check2 v-if="copiedAll" />
        <i-bi-clipboard v-else />
        Copy All
      </BButton>
      <BButton variant="outline-danger" @click="confirmDismissVisible = true">
        <i-bi-trash />
        Clear All
      </BButton>
      <BButton variant="secondary" @click="overlayVisible = false">
        Close
      </BButton>
    </template>
  </BModal>

  <BModal v-model="confirmDismissVisible" title="Clear all errors?" size="sm">
    <p>Dismiss all {{ errorStore.errorCount }} error message(s)?</p>
    <template #footer>
      <BButton variant="danger" @click="confirmedDismissAll">Clear All</BButton>
      <BButton variant="secondary" @click="confirmDismissVisible = false">Cancel</BButton>
    </template>
  </BModal>
</template>

<style scoped>
.error-fab {
  position: fixed;
  bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
  left: calc(1.5rem + env(safe-area-inset-left, 0px));
  z-index: 1060;
  width: 3.5rem;
  height: 3.5rem;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Keep button inside Bootstrap container at each breakpoint */
@media (min-width: 576px) {
  .error-fab {
    left: calc((100vw - 540px) / 2 + 1.5rem);
  }
}

@media (min-width: 768px) {
  .error-fab {
    left: calc((100vw - 720px) / 2 + 1.5rem);
  }
}

@media (min-width: 992px) {
  .error-fab {
    left: calc((100vw - 960px) / 2 + 1.5rem);
  }
}

@media (min-width: 1200px) {
  .error-fab {
    left: calc((100vw - 1140px) / 2 + 1.5rem);
  }
}

@media (min-width: 1400px) {
  .error-fab {
    left: calc((100vw - 1320px) / 2 + 1.5rem);
  }
}

</style>
