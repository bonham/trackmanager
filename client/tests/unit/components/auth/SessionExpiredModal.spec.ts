import { render, fireEvent } from '@testing-library/vue'
import { describe, test, expect, vi } from 'vitest'
import SessionExpiredModal from '@/components/auth/SessionExpiredModal.vue'

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
    emits: ['click'],
    template: `<button @click="$emit('click')"><slot /></button>`,
  },
}))

function renderModal(visible = true) {
  return render(SessionExpiredModal, { props: { visible } })
}

describe('SessionExpiredModal', () => {
  test('renders message and buttons when visible', () => {
    const { getByText, getByRole } = renderModal()
    expect(getByText(/Your session has expired/)).toBeInTheDocument()
    expect(getByRole('button', { name: 'Login' })).toBeInTheDocument()
    expect(getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  test('does not render when not visible', () => {
    const { queryByText } = renderModal(false)
    expect(queryByText(/Your session has expired/)).not.toBeInTheDocument()
  })

  test('does not show a Register button', () => {
    const { queryByRole } = renderModal()
    expect(queryByRole('button', { name: 'Register' })).not.toBeInTheDocument()
  })

  test('Login button emits login event', async () => {
    const { getByRole, emitted } = renderModal()
    await fireEvent.click(getByRole('button', { name: 'Login' }))
    expect(emitted()).toHaveProperty('login')
  })

  test('Cancel button emits cancel event', async () => {
    const { getByRole, emitted } = renderModal()
    await fireEvent.click(getByRole('button', { name: 'Cancel' }))
    expect(emitted()).toHaveProperty('cancel')
  })
})
