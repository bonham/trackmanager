import { render, fireEvent, waitFor } from '@testing-library/vue'
import { within } from '@testing-library/dom'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import ErrorIndicator from '@/components/ErrorIndicator.vue'
import { useErrorStore } from '@/stores/errorstore'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('bootstrap-vue-next', () => ({
  BModal: {
    name: 'BModal',
    props: {
      modelValue: { type: Boolean, default: false },
      title: { type: String, default: '' },
    },
    emits: ['update:modelValue'],
    template: `
      <div v-if="modelValue" :data-modal-title="title">
        <slot />
        <slot name="footer" />
      </div>
    `,
  },
  BButton: {
    name: 'BButton',
    props: { variant: String },
    emits: ['click'],
    template: `<button @click="$emit('click')"><slot /></button>`,
  },
}))

// ---------------------------------------------------------------------------
// Clipboard stub
// ---------------------------------------------------------------------------

const mockWriteText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined)

beforeEach(() => {
  mockWriteText.mockClear()
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: mockWriteText },
    configurable: true,
    writable: true,
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// Render helper
// Errors are pre-populated BEFORE render so the component mounts with the
// correct state already in the store (avoids nextTick() gaps in most tests).
// ---------------------------------------------------------------------------

function renderIndicator(initialErrors: { message: string; detail?: string }[] = []) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useErrorStore()
  for (const { message, detail } of initialErrors) store.addError(message, detail)
  const result = render(ErrorIndicator, { global: { plugins: [pinia] } })
  return { ...result, store }
}

// Helper: open the error overlay by clicking the FAB.
async function openOverlay(getByRole: ReturnType<typeof render>['getByRole']) {
  await fireEvent.click(getByRole('button', { name: /error/i }))
}

// ---------------------------------------------------------------------------
// FAB (floating action button)
// ---------------------------------------------------------------------------

describe('ErrorIndicator – FAB', () => {
  test('no button is rendered when the store is empty', () => {
    const { queryByRole } = renderIndicator()
    expect(queryByRole('button')).not.toBeInTheDocument()
  })

  test('button is rendered when the store has at least one error', () => {
    const { getByRole } = renderIndicator([{ message: 'network error' }])
    expect(getByRole('button', { name: /error/i })).toBeInTheDocument()
  })

  test('button appears reactively after an error is added post-render', async () => {
    const { queryByRole, store } = renderIndicator()
    expect(queryByRole('button')).not.toBeInTheDocument()

    store.addError('late arrival')
    await nextTick()

    expect(queryByRole('button', { name: /error/i })).toBeInTheDocument()
  })

  test('aria-label includes the error count', () => {
    const { getByRole } = renderIndicator([
      { message: 'e1' },
      { message: 'e2' },
      { message: 'e3' },
    ])
    expect(getByRole('button', { name: /3 error/i })).toBeInTheDocument()
  })

  test('badge shows the numeric count for a small number of errors', () => {
    const { getByText } = renderIndicator([
      { message: 'a' },
      { message: 'b' },
      { message: 'c' },
    ])
    expect(getByText('3')).toBeInTheDocument()
  })

  test('badge shows "99+" when there are exactly 100 errors', () => {
    const errors = Array.from({ length: 100 }, (_, i) => ({ message: `msg-${i}` }))
    const { getByText } = renderIndicator(errors)
    expect(getByText('99+')).toBeInTheDocument()
  })

  test('badge shows "99+" when there are more than 100 errors', () => {
    const errors = Array.from({ length: 150 }, (_, i) => ({ message: `msg-${i}` }))
    const { getByText } = renderIndicator(errors)
    expect(getByText('99+')).toBeInTheDocument()
  })

  test('clicking the button opens the error overlay', async () => {
    const { getByRole, getByText } = renderIndicator([{ message: 'visible error' }])
    await openOverlay(getByRole)
    expect(getByText('visible error')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Error overlay (main modal)
// ---------------------------------------------------------------------------

describe('ErrorIndicator – error overlay', () => {
  test('error messages are NOT visible before the FAB is clicked', () => {
    const { queryByText } = renderIndicator([{ message: 'hidden message' }])
    expect(queryByText('hidden message')).not.toBeInTheDocument()
  })

  test('all error messages are listed after opening', async () => {
    const { getByRole, getByText } = renderIndicator([
      { message: 'first error' },
      { message: 'second error' },
    ])
    await openOverlay(getByRole)
    expect(getByText('first error')).toBeInTheDocument()
    expect(getByText('second error')).toBeInTheDocument()
  })

  test('the timestamp of each error is visible', async () => {
    const { getByRole, store } = renderIndicator([{ message: 'ts message' }])
    const expectedTime = store.errors[0]!.timestamp.toLocaleTimeString()

    await openOverlay(getByRole)

    expect(document.body.textContent).toContain(expectedTime)
  })

  test('detail text is shown when the entry has a detail field', async () => {
    const { getByRole, getByText } = renderIndicator([
      { message: 'main msg', detail: 'stack line 1\nstack line 2' },
    ])
    await openOverlay(getByRole)
    expect(getByText(/stack line 1/)).toBeInTheDocument()
  })

  test('detail is not rendered as "undefined" when the entry has no detail', async () => {
    const { getByRole, queryByText } = renderIndicator([{ message: 'no detail' }])
    await openOverlay(getByRole)
    expect(queryByText('undefined')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Dismiss individual error
// ---------------------------------------------------------------------------

describe('ErrorIndicator – dismiss individual', () => {
  test('clicking the dismiss button removes that entry from the list', async () => {
    const { getByRole, queryByText, getByText } = renderIndicator([
      { message: 'gone soon' },
      { message: 'stays here' },
    ])
    await openOverlay(getByRole)
    expect(getByText('gone soon')).toBeInTheDocument()

    const dismissBtns = document.querySelectorAll('button[aria-label="Dismiss"]')
    await fireEvent.click(dismissBtns[0]!) // first entry = 'gone soon'

    expect(queryByText('gone soon')).not.toBeInTheDocument()
    expect(getByText('stays here')).toBeInTheDocument()
  })

  test('remaining error count is correct after dismissing one', async () => {
    const { getByRole, store } = renderIndicator([
      { message: 'a' },
      { message: 'b' },
      { message: 'c' },
    ])
    await openOverlay(getByRole)

    const dismissBtns = document.querySelectorAll('button[aria-label="Dismiss"]')
    await fireEvent.click(dismissBtns[0]!) // remove 'a'

    expect(store.errorCount).toBe(2)
    expect(store.errors.map(e => e.message)).toEqual(['b', 'c'])
  })
})

// ---------------------------------------------------------------------------
// Clear All flow
// ---------------------------------------------------------------------------

describe('ErrorIndicator – clear all', () => {
  test('clicking "Clear All" in the overlay opens a confirmation dialog', async () => {
    const { getByRole, getByText } = renderIndicator([{ message: 'some error' }])
    await openOverlay(getByRole)
    await fireEvent.click(getByRole('button', { name: 'Clear All' }))

    expect(getByText(/Dismiss all/)).toBeInTheDocument()
  })

  test('confirmation dialog shows the current error count', async () => {
    const { getByRole, getByText } = renderIndicator([
      { message: 'err-1' },
      { message: 'err-2' },
    ])
    await openOverlay(getByRole)
    await fireEvent.click(getByRole('button', { name: 'Clear All' }))

    expect(getByText(/Dismiss all 2/)).toBeInTheDocument()
  })

  test('clicking "Cancel" in the confirmation keeps all errors', async () => {
    const { getByRole, store } = renderIndicator([{ message: 'survives' }])
    await openOverlay(getByRole)
    await fireEvent.click(getByRole('button', { name: 'Clear All' }))
    await fireEvent.click(getByRole('button', { name: 'Cancel' }))

    expect(store.errorCount).toBe(1)
    expect(store.errors[0]!.message).toBe('survives')
  })

  test('confirming "Clear All" empties the error store', async () => {
    const { getByRole, container, store } = renderIndicator([
      { message: 'gone-1' },
      { message: 'gone-2' },
    ])
    await openOverlay(getByRole)
    await fireEvent.click(getByRole('button', { name: 'Clear All' }))

    // Two "Clear All" buttons are in the DOM at this point: one from the main
    // modal footer, one from the confirm dialog. Scope to the confirm dialog.
    const confirmModal = container.querySelector<HTMLElement>('[data-modal-title="Clear all errors?"]')!
    await fireEvent.click(within(confirmModal).getByRole('button', { name: 'Clear All' }))

    expect(store.errorCount).toBe(0)
    expect(store.hasErrors).toBe(false)
  })

  test('confirming "Clear All" hides both the overlay and the confirmation dialog', async () => {
    const { getByRole, queryByText, container } = renderIndicator([
      { message: 'will-disappear' },
    ])
    await openOverlay(getByRole)
    await fireEvent.click(getByRole('button', { name: 'Clear All' }))

    const confirmModal = container.querySelector<HTMLElement>('[data-modal-title="Clear all errors?"]')!
    await fireEvent.click(within(confirmModal).getByRole('button', { name: 'Clear All' }))

    expect(queryByText('will-disappear')).not.toBeInTheDocument()
    expect(queryByText(/Dismiss all/)).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Clipboard – copy single message
// ---------------------------------------------------------------------------

describe('ErrorIndicator – copy single message', () => {
  test('clicking the copy button invokes the clipboard API', async () => {
    const { getByRole, getAllByTitle } = renderIndicator([{ message: 'clipboard-test' }])
    await openOverlay(getByRole)
    await fireEvent.click(getAllByTitle('Copy message')[0]!)

    await waitFor(() => expect(mockWriteText).toHaveBeenCalledTimes(1))
  })

  test('clipboard receives [ISO-timestamp] message format', async () => {
    const { getByRole, getAllByTitle, store } = renderIndicator([{ message: 'format check' }])
    const entry = store.errors[0]!
    await openOverlay(getByRole)
    await fireEvent.click(getAllByTitle('Copy message')[0]!)

    const expected = `[${entry.timestamp.toISOString()}] ${entry.message}`
    await waitFor(() => expect(mockWriteText).toHaveBeenCalledWith(expected))
  })

  test('clipboard text includes the detail on a new line when present', async () => {
    const { getByRole, getAllByTitle, store } = renderIndicator([
      { message: 'err with detail', detail: 'Error: inner\n  at foo.ts:10' },
    ])
    const entry = store.errors[0]!
    await openOverlay(getByRole)
    await fireEvent.click(getAllByTitle('Copy message')[0]!)

    const expected = `[${entry.timestamp.toISOString()}] ${entry.message}\n${entry.detail}`
    await waitFor(() => expect(mockWriteText).toHaveBeenCalledWith(expected))
  })

  test('clipboard text does not end with a newline when there is no detail', async () => {
    const { getByRole, getAllByTitle, store } = renderIndicator([{ message: 'clean' }])
    const entry = store.errors[0]!
    await openOverlay(getByRole)
    await fireEvent.click(getAllByTitle('Copy message')[0]!)

    await waitFor(() => {
      const arg = mockWriteText.mock.lastCall![0]
      expect(arg).toBe(`[${entry.timestamp.toISOString()}] ${entry.message}`)
      expect(arg.endsWith('\n')).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// Clipboard – copy all messages
// ---------------------------------------------------------------------------

describe('ErrorIndicator – copy all messages', () => {
  test('Copy All writes all entries joined by a separator', async () => {
    const { getByRole, getByText, store } = renderIndicator([
      { message: 'first' },
      { message: 'second' },
    ])
    const [e1, e2] = store.errors
    await openOverlay(getByRole)
    await fireEvent.click(getByText('Copy All'))

    const expected =
      `[${e1!.timestamp.toISOString()}] ${e1!.message}` +
      '\n\n---\n\n' +
      `[${e2!.timestamp.toISOString()}] ${e2!.message}`

    await waitFor(() => expect(mockWriteText).toHaveBeenCalledWith(expected))
  })

  test('Copy All for a single entry produces no separator', async () => {
    const { getByRole, getByText, store } = renderIndicator([{ message: 'solo entry' }])
    const entry = store.errors[0]!
    await openOverlay(getByRole)
    await fireEvent.click(getByText('Copy All'))

    await waitFor(() => {
      const arg = mockWriteText.mock.lastCall![0]
      expect(arg).toBe(`[${entry.timestamp.toISOString()}] ${entry.message}`)
      expect(arg).not.toContain('---')
    })
  })

  test('Copy All includes detail lines for entries that have them', async () => {
    const { getByRole, getByText, store } = renderIndicator([
      { message: 'err', detail: 'Error: boom\n  at bar.ts:5' },
    ])
    const entry = store.errors[0]!
    await openOverlay(getByRole)
    await fireEvent.click(getByText('Copy All'))

    await waitFor(() => {
      const arg = mockWriteText.mock.lastCall![0]
      expect(arg).toContain(entry.detail!)
    })
  })
})
