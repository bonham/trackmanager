/**
 * Error reporting store + utility
 *
 * HOW TO REPORT AN ERROR (preferred)
 * ------------------------------------
 * Import and call `reportError()` anywhere in the app:
 *
 *   import { reportError } from '@/stores/errorstore'
 *
 *   reportError('Failed to load track')            // plain string
 *   reportError('Request failed:', new Error(...)) // string + Error object
 *   reportError(err)                               // bare Error object
 *
 * `reportError` forwards its arguments to `console.error` as well,
 * so existing debugging workflows are unaffected.
 *
 * HOW TO ADD AN ERROR WITHOUT console.error (low-level)
 * -------------------------------------------------------
 * Use the store directly when you want to surface a UI message without
 * a console entry, or when you already have a pre-formatted string:
 *
 *   import { useErrorStore } from '@/stores/errorstore'
 *
 *   const errorStore = useErrorStore()
 *   errorStore.addError('Session expired')
 *   errorStore.addError('Upload failed', stack) // optional stack/detail string
 *
 * UI COMPONENT
 * ------------
 * `<ErrorIndicator />` is mounted once in App.vue. It watches the store
 * reactively and shows a floating badge whenever errors are present.
 * No further wiring is needed — just call reportError() or addError().
 */
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface ErrorEntry {
  id: number
  message: string
  timestamp: Date
  detail?: string
}

const MAX_ERRORS = 200 // oldest entry is evicted when the cap is reached
let _nextId = 1        // module-level counter; survives store resets

const useErrorStore = defineStore('errorstore', () => {
  const errors = ref<ErrorEntry[]>([])

  function addError(message: string, detail?: string) {
    if (errors.value.length >= MAX_ERRORS) errors.value.shift()
    errors.value.push({ id: _nextId++, message, timestamp: new Date(), detail })
  }

  function dismissError(id: number) {
    const idx = errors.value.findIndex(e => e.id === id)
    if (idx !== -1) errors.value.splice(idx, 1)
  }

  function dismissAll() {
    errors.value = []
  }

  const errorCount = computed(() => errors.value.length)
  const hasErrors = computed(() => errors.value.length > 0)

  return { errors, errorCount, hasErrors, addError, dismissError, dismissAll }
})

/** Drop-in replacement for console.error() that also surfaces the error to the UI.
 *  Call this for errors that are meaningful to the end user. */
function reportError(...args: unknown[]): void {
  console.error(...args)
  const message = args.map(a =>
    typeof a === 'string' ? a
      : a instanceof Error ? `${a.name}: ${a.message}`
        : (() => { try { return JSON.stringify(a) } catch { return String(a) } })()
  ).join(' ')
  const detail = (args.find((a): a is Error => a instanceof Error))?.stack
  useErrorStore().addError(message, detail)
}

export { useErrorStore, reportError }
